import fs from "node:fs";
import path from "node:path";
import { EventEmitter } from "node:events";
import chokidar, { type FSWatcher } from "chokidar";
import type { AgentMetadata, OfficeEvent } from "@office/shared";
import { defaultParserRegistry, ParserRegistry } from "../parsers/parserRegistry.js";

export interface LogWatcherOptions {
  baseDir?: string;
  readFromBeginning?: boolean;
  parserRegistry?: ParserRegistry;
}

/**
 * Gestor de monitorización incremental de ficheros de log mediante Chokidar.
 * Lee únicamente bytes añadidos (tail -f incremental) y los convierte en OfficeEvents.
 */
export class LogWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private fileOffsets: Map<string, number> = new Map();
  private lineBuffers: Map<string, string> = new Map();
  private agentTargets: Map<string, AgentMetadata[]> = new Map(); // normalizedPath -> agents
  private baseDir: string;
  private readFromBeginning: boolean;
  private parserRegistry: ParserRegistry;
  private isWatching: boolean = false;

  constructor(options: LogWatcherOptions = {}) {
    super();
    this.baseDir = options.baseDir || process.cwd();
    this.readFromBeginning = options.readFromBeginning ?? false;
    this.parserRegistry = options.parserRegistry || defaultParserRegistry;
  }

  /**
   * Resuelve una ruta de archivo relativa a baseDir o mantiene absolutas.
   */
  resolvePath(targetPath: string): string {
    return path.isAbsolute(targetPath) ? path.normalize(targetPath) : path.normalize(path.resolve(this.baseDir, targetPath));
  }

  /**
   * Registra un agente y su ruta de log a monitorizar.
   */
  addAgent(agent: AgentMetadata): void {
    const fullPath = this.resolvePath(agent.watch_target);
    const existing = this.agentTargets.get(fullPath) || [];

    if (!existing.some((a) => a.id === agent.id)) {
      existing.push(agent);
      this.agentTargets.set(fullPath, existing);
    }

    if (this.isWatching && this.watcher) {
      this.watcher.add(fullPath);
    }
  }

  /**
   * Registra una lista de agentes.
   */
  addAgents(agents: AgentMetadata[]): void {
    for (const agent of agents) {
      this.addAgent(agent);
    }
  }

  /**
   * Elimina un agente del watcher.
   */
  removeAgent(agentId: string): void {
    for (const [filePath, agents] of this.agentTargets.entries()) {
      const filtered = agents.filter((a) => a.id !== agentId);
      if (filtered.length === 0) {
        this.agentTargets.delete(filePath);
        if (this.watcher) {
          this.watcher.unwatch(filePath);
        }
      } else {
        this.agentTargets.set(filePath, filtered);
      }
    }
  }

  /**
   * Inicia el proceso de observación con Chokidar.
   */
  async start(): Promise<void> {
    if (this.isWatching) return;

    const pathsToWatch = Array.from(this.agentTargets.keys());

    // Inicializar offsets
    for (const p of pathsToWatch) {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        this.fileOffsets.set(p, this.readFromBeginning ? 0 : stat.size);
      } else {
        this.fileOffsets.set(p, 0);
      }
    }

    this.watcher = chokidar.watch(pathsToWatch, {
      persistent: true,
      ignoreInitial: !this.readFromBeginning,
      usePolling: process.platform === "win32",
      interval: 150
    });

    this.watcher.on("add", (filePath) => {
      const normalized = path.normalize(filePath);
      if (this.readFromBeginning) {
        this.handleFileChange(normalized);
      } else if (!this.fileOffsets.has(normalized) && fs.existsSync(normalized)) {
        this.fileOffsets.set(normalized, fs.statSync(normalized).size);
      }
    });

    this.watcher.on("change", (filePath) => {
      this.handleFileChange(path.normalize(filePath));
    });

    this.watcher.on("unlink", (filePath) => {
      const normalized = path.normalize(filePath);
      this.fileOffsets.delete(normalized);
      this.lineBuffers.delete(normalized);
    });

    this.isWatching = true;
  }

  /**
   * Procesa de forma incremental las nuevas líneas agregadas a un archivo.
   */
  handleFileChange(filePath: string): void {
    try {
      if (!fs.existsSync(filePath)) return;

      const stat = fs.statSync(filePath);
      const currentSize = stat.size;
      let offset = this.fileOffsets.get(filePath) ?? 0;

      // Si el archivo se redujo de tamaño (truncado o recreado)
      if (currentSize < offset) {
        offset = 0;
        this.lineBuffers.set(filePath, "");
      }

      if (currentSize === offset) return;

      const bytesToRead = currentSize - offset;
      const buffer = Buffer.alloc(bytesToRead);
      const fd = fs.openSync(filePath, "r");

      try {
        fs.readSync(fd, buffer, 0, bytesToRead, offset);
      } finally {
        fs.closeSync(fd);
      }

      this.fileOffsets.set(filePath, currentSize);

      const prevRemainder = this.lineBuffers.get(filePath) || "";
      const text = prevRemainder + buffer.toString("utf-8");
      const lines = text.split(/\r?\n/);

      // El último elemento se guarda si no terminó con salto de línea
      const remainder = lines.pop() || "";
      this.lineBuffers.set(filePath, remainder);

      for (const line of lines) {
        if (!line.trim()) continue;
        this.dispatchLine(filePath, line);
      }
    } catch (error) {
      console.error(`[LogWatcher] Error al leer archivo incremental ${filePath}:`, error);
    }
  }

  /**
   * Despacha una línea leída a los parsers correspondientes de cada agente asignado.
   */
  dispatchLine(filePath: string, line: string): void {
    const agents = this.agentTargets.get(filePath) || [];
    if (agents.length === 0) return;

    for (const agent of agents) {
      const parser = this.parserRegistry.resolveParserForAgent(agent);
      const event = parser.parseLine(line, agent.id, {
        sourceFile: filePath,
        agentName: agent.name,
        model: agent.model
      });

      if (event) {
        this.emit("event", event);
      }
    }
  }

  /**
   * Registra un callback para recibir los eventos emitidos.
   */
  onEvent(callback: (event: OfficeEvent) => void): () => void {
    this.on("event", callback);
    return () => this.off("event", callback);
  }

  /**
   * Obtiene la lista de rutas actualmente monitoreadas.
   */
  getWatchedFiles(): string[] {
    return Array.from(this.agentTargets.keys());
  }

  /**
   * Reinicia el offset de un archivo para relectura.
   */
  resetOffset(filePath: string, newOffset: number = 0): void {
    const normalized = this.resolvePath(filePath);
    this.fileOffsets.set(normalized, newOffset);
    this.lineBuffers.delete(normalized);
  }

  /**
   * Detiene el watcher y libera recursos.
   */
  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.isWatching = false;
    this.fileOffsets.clear();
    this.lineBuffers.clear();
  }
}
