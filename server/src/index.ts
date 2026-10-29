import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import express, { type Request, type Response } from "express";
import type { OfficeConfig, OfficeEvent } from "@office/shared";
import { loadOfficeConfig } from "./config/configLoader.js";
import { MockGenerator } from "./simulator/mockGenerator.js";
import { OfficeSocketServer } from "./socket/socketServer.js";
import { LogWatcher } from "./watchers/logWatcher.js";

export interface ServerInstance {
  app: express.Express;
  httpServer: http.Server;
  socketServer: OfficeSocketServer;
  mockGenerator: MockGenerator;
  logWatcher: LogWatcher;
  config: OfficeConfig;
  close: () => Promise<void>;
}

export function createOfficeServer(customPort?: number): ServerInstance {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(express.json());

  // Habilitar CORS para peticiones HTTP
  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    next();
  });

  // 1. Cargar configuración de office.config.yaml
  let config: OfficeConfig;
  try {
    config = loadOfficeConfig();
  } catch (error) {
    console.warn("[Daemon] No se pudo cargar office.config.yaml, usando configuración por defecto:", error);
    config = {
      version: "1.0",
      settings: { refresh_rate_ms: 500, websocket_port: 4000, http_port: 3000 },
      offices: [],
      agents: [
        {
          id: "architect",
          name: "Architect Agent",
          model: "Claude 3.7 Sonnet (Claude Code)",
          sprite: "avatar_blue",
          watch_target: "logs/architect.jsonl"
        },
        {
          id: "backend-developer",
          name: "Backend Developer",
          model: "Gemini 2.5 Flash",
          sprite: "avatar_green",
          watch_target: "logs/backend.jsonl"
        },
        {
          id: "qa-engineer",
          name: "QA Specialist",
          model: "Claude 3.5 Haiku",
          sprite: "avatar_purple",
          watch_target: "logs/qa.jsonl"
        }
      ]
    };
  }

  // 2. Inicializar Simulador Mock
  const mockGenerator = new MockGenerator(config);

  // 3. Inicializar Servidor Socket.io
  const socketServer = new OfficeSocketServer(httpServer, config, mockGenerator);

  // 4. Enrutar eventos generados por el simulador mock hacia Socket.io
  mockGenerator.onEvent((event: OfficeEvent) => {
    socketServer.broadcastEvent(event);
  });

  // 5. Inicializar Watcher Chokidar de logs locales
  const logWatcher = new LogWatcher({
    baseDir: process.cwd()
  });

  logWatcher.addAgents(config.agents);

  logWatcher.onEvent((event: OfficeEvent) => {
    socketServer.broadcastEvent(event);
  });

  // Iniciar observación de ficheros si no es entorno de pruebas
  if (process.env.NODE_ENV !== "test") {
    logWatcher.start().catch((err) => {
      console.error("[Daemon] Error al iniciar LogWatcher:", err);
    });
  }

  // 6. Configurar Endpoints REST
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      service: "ai-agent-office-daemon",
      timestamp: new Date().toISOString(),
      connectedClients: socketServer.getConnectedClientsCount(),
      simulation: {
        running: mockGenerator.isRunning()
      }
    });
  });

  app.get("/api/config", (_req: Request, res: Response) => {
    res.json(config);
  });

  app.post("/api/simulate/start", (req: Request, res: Response) => {
    const interval = typeof req.body?.intervalMs === "number" ? req.body.intervalMs : undefined;
    mockGenerator.start(interval);
    res.json({
      success: true,
      running: true,
      message: "Simulación de oficina iniciada."
    });
  });

  app.post("/api/simulate/stop", (_req: Request, res: Response) => {
    mockGenerator.stop();
    res.json({
      success: true,
      running: false,
      message: "Simulación de oficina pausada."
    });
  });

  app.post("/api/simulate/step", (_req: Request, res: Response) => {
    const event = mockGenerator.emitSingleStep();
    res.json({
      success: true,
      event
    });
  });

  // 7. Evaluar auto-inicio de simulación mock:
  // Se activa si se pasa --mock, o si no existen archivos de logs activos en disco.
  const hasMockFlag = process.argv.includes("--mock");
  const anyLogFileExists = config.agents.some((agent) => {
    const resolvedPath = path.isAbsolute(agent.watch_target)
      ? agent.watch_target
      : path.resolve(process.cwd(), agent.watch_target);
    return fs.existsSync(resolvedPath);
  });

  if (process.env.NODE_ENV !== "test" && (hasMockFlag || !anyLogFileExists)) {
    console.log("[Daemon] Activando simulación mock para asegurar actividad en vivo en el visualizador.");
    mockGenerator.start();
  }

  const close = async (): Promise<void> => {
    mockGenerator.stop();
    await logWatcher.stop();
    await socketServer.close();
    if (httpServer.listening) {
      await new Promise<void>((resolve) => {
        httpServer.close(() => resolve());
      });
    }
  };

  const port = customPort || Number(process.env.PORT) || config.settings.websocket_port || 4000;

  if (process.env.NODE_ENV !== "test") {
    httpServer.listen(port, () => {
      console.log(`[Daemon] AI Agent Office corriendo en http://localhost:${port}`);
    });
  }

  return {
    app,
    httpServer,
    socketServer,
    mockGenerator,
    logWatcher,
    config,
    close
  };
}

// Iniciar servidor si se ejecuta directamente
if (process.env.NODE_ENV !== "test" && !process.env.VITEST) {
  createOfficeServer();
}

export default createOfficeServer;
