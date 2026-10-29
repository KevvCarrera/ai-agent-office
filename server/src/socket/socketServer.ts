import http from "node:http";
import { Server as SocketIOServer, type Socket } from "socket.io";
import type { OfficeConfig, OfficeEvent, AgentState } from "@office/shared";
import type { MockGenerator } from "../simulator/mockGenerator.js";

export interface AgentCurrentState {
  state: AgentState;
  lastEvent?: OfficeEvent;
  updatedAt: string;
}

/**
 * Gestor del servidor WebSocket basado en Socket.io.
 * Mantiene sincronizados a todos los clientes web (Phaser 3) con la actividad del despacho.
 */
export class OfficeSocketServer {
  private io: SocketIOServer;
  private config?: OfficeConfig;
  private mockGenerator?: MockGenerator;
  private agentStates: Map<string, AgentCurrentState> = new Map();

  constructor(server: http.Server, config?: OfficeConfig, mockGenerator?: MockGenerator) {
    this.config = config;
    this.mockGenerator = mockGenerator;

    this.io = new SocketIOServer(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.initializeAgentStates();
    this.setupSocketHandlers();
  }

  /**
   * Inicializa los estados por defecto de los agentes según la configuración.
   */
  private initializeAgentStates(): void {
    if (!this.config) return;

    for (const agent of this.config.agents) {
      this.agentStates.set(agent.id, {
        state: "IDLE",
        updatedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Configura los listeners de eventos entrantes de los clientes conectados.
   */
  private setupSocketHandlers(): void {
    this.io.on("connection", (socket: Socket) => {
      // 1. Enviar configuración inicial si existe
      if (this.config) {
        socket.emit("office:config", this.config);
      }

      // 2. Enviar estado actual agregado de los agentes
      socket.emit("office:agents:state", this.getAgentStatesObject());

      // 3. Listener para alternar simulación desde el cliente
      socket.on("simulate:toggle", (data, callback) => {
        if (!this.mockGenerator) {
          if (typeof callback === "function") callback({ success: false, error: "Mock generator no disponible" });
          return;
        }

        if (this.mockGenerator.isRunning()) {
          this.mockGenerator.stop();
        } else {
          const interval = typeof data?.intervalMs === "number" ? data.intervalMs : undefined;
          this.mockGenerator.start(interval);
        }

        const isRunning = this.mockGenerator.isRunning();
        this.io.emit("office:simulation:status", { running: isRunning });

        if (typeof callback === "function") {
          callback({ success: true, running: isRunning });
        }
      });

      // 4. Listener para avanzar un solo paso manual
      socket.on("simulate:step", (_data, callback) => {
        if (!this.mockGenerator) {
          if (typeof callback === "function") callback({ success: false, error: "Mock generator no disponible" });
          return;
        }

        const event = this.mockGenerator.emitSingleStep();
        if (typeof callback === "function") {
          callback({ success: true, event });
        }
      });

      socket.on("disconnect", () => {
        // Desconexión limpia
      });
    });
  }

  /**
   * Emite un evento a todos los clientes y actualiza la tabla de estados de los agentes.
   */
  broadcastEvent(event: OfficeEvent): void {
    // Actualizar estado del agente emisor
    this.agentStates.set(event.agentId, {
      state: event.state,
      lastEvent: event,
      updatedAt: event.timestamp || new Date().toISOString()
    });

    // Difundir evento individual
    this.io.emit("office:event", event);

    // Difundir estado agregado actualizado
    this.io.emit("office:agents:state", this.getAgentStatesObject());
  }

  /**
   * Actualiza y retransmite la configuración de la oficina.
   */
  broadcastConfig(config: OfficeConfig): void {
    this.config = config;
    this.initializeAgentStates();
    this.io.emit("office:config", config);
    this.io.emit("office:agents:state", this.getAgentStatesObject());
  }

  /**
   * Retorna el número de clientes actualmente conectados al WebSocket.
   */
  getConnectedClientsCount(): number {
    return this.io.sockets.sockets.size;
  }

  /**
   * Retorna el mapa de estados en formato de objeto JSON plano.
   */
  getAgentStatesObject(): Record<string, AgentCurrentState> {
    const result: Record<string, AgentCurrentState> = {};
    for (const [agentId, state] of this.agentStates.entries()) {
      result[agentId] = state;
    }
    return result;
  }

  /**
   * Cierra el servidor Socket.io.
   */
  close(): Promise<void> {
    return new Promise((resolve) => {
      this.io.close(() => resolve());
    });
  }

  getIOServer(): SocketIOServer {
    return this.io;
  }
}
