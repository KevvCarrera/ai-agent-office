import { io, type Socket } from "socket.io-client";
import type { OfficeConfig, OfficeEvent, AgentState } from "@office/shared";

export interface AgentCurrentState {
  state: AgentState;
  lastEvent?: OfficeEvent;
  updatedAt: string;
}

export type EventListener<T> = (data: T) => void;

export class SocketClient {
  private socket: Socket | null = null;
  private config: OfficeConfig | null = null;
  private agentStates: Record<string, AgentCurrentState> = {};
  private simulationRunning = false;

  private connectListeners: Array<() => void> = [];
  private disconnectListeners: Array<() => void> = [];
  private configListeners: Array<EventListener<OfficeConfig>> = [];
  private eventListeners: Array<EventListener<OfficeEvent>> = [];
  private agentsStateListeners: Array<EventListener<Record<string, AgentCurrentState>>> = [];
  private simulationStatusListeners: Array<EventListener<{ running: boolean }>> = [];

  constructor() {
    this.initSocket();
  }

  private getServerUrl(): string {
    const hostname = typeof window !== "undefined" && window.location.hostname ? window.location.hostname : "localhost";
    return `http://${hostname}:4000`;
  }

  private initSocket(): void {
    const serverUrl = this.getServerUrl();
    this.socket = io(serverUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      autoConnect: true
    });

    this.socket.on("connect", () => {
      console.log(`[SocketClient] Conectado al servidor WebSocket en ${serverUrl}`);
      this.connectListeners.forEach((cb) => cb());
    });

    this.socket.on("disconnect", (reason) => {
      console.warn(`[SocketClient] Desconectado del servidor WebSocket: ${reason}`);
      this.disconnectListeners.forEach((cb) => cb());
    });

    this.socket.on("office:config", (config: OfficeConfig) => {
      this.config = config;
      this.configListeners.forEach((cb) => cb(config));
    });

    this.socket.on("office:event", (event: OfficeEvent) => {
      if (event.agentId && this.agentStates[event.agentId]) {
        this.agentStates[event.agentId] = {
          state: event.state,
          lastEvent: event,
          updatedAt: event.timestamp || new Date().toISOString()
        };
      }
      this.eventListeners.forEach((cb) => cb(event));
    });

    this.socket.on("office:agents:state", (states: Record<string, AgentCurrentState>) => {
      this.agentStates = states;
      this.agentsStateListeners.forEach((cb) => cb(states));
    });

    this.socket.on("office:simulation:status", (status: { running: boolean }) => {
      this.simulationRunning = status.running;
      this.simulationStatusListeners.forEach((cb) => cb(status));
    });
  }

  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  public isSimulationRunning(): boolean {
    return this.simulationRunning;
  }

  public getConfig(): OfficeConfig | null {
    return this.config;
  }

  public getAgentStates(): Record<string, AgentCurrentState> {
    return this.agentStates;
  }

  public onConnect(cb: () => void): () => void {
    this.connectListeners.push(cb);
    if (this.isConnected()) cb();
    return () => {
      this.connectListeners = this.connectListeners.filter((listener) => listener !== cb);
    };
  }

  public onDisconnect(cb: () => void): () => void {
    this.disconnectListeners.push(cb);
    return () => {
      this.disconnectListeners = this.disconnectListeners.filter((listener) => listener !== cb);
    };
  }

  public onConfig(cb: EventListener<OfficeConfig>): () => void {
    this.configListeners.push(cb);
    if (this.config) cb(this.config);
    return () => {
      this.configListeners = this.configListeners.filter((listener) => listener !== cb);
    };
  }

  public onEvent(cb: EventListener<OfficeEvent>): () => void {
    this.eventListeners.push(cb);
    return () => {
      this.eventListeners = this.eventListeners.filter((listener) => listener !== cb);
    };
  }

  public onAgentsState(cb: EventListener<Record<string, AgentCurrentState>>): () => void {
    this.agentsStateListeners.push(cb);
    if (Object.keys(this.agentStates).length > 0) cb(this.agentStates);
    return () => {
      this.agentsStateListeners = this.agentsStateListeners.filter((listener) => listener !== cb);
    };
  }

  public onSimulationStatus(cb: EventListener<{ running: boolean }>): () => void {
    this.simulationStatusListeners.push(cb);
    cb({ running: this.simulationRunning });
    return () => {
      this.simulationStatusListeners = this.simulationStatusListeners.filter((listener) => listener !== cb);
    };
  }

  public toggleSimulation(intervalMs?: number): Promise<{ success: boolean; running?: boolean }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        resolve({ success: false });
        return;
      }
      this.socket.emit("simulate:toggle", { intervalMs }, (response: { success: boolean; running?: boolean }) => {
        if (response && typeof response.running === "boolean") {
          this.simulationRunning = response.running;
          this.simulationStatusListeners.forEach((cb) => cb({ running: response.running! }));
        }
        resolve(response || { success: false });
      });
    });
  }

  public stepSimulation(): Promise<{ success: boolean; event?: OfficeEvent }> {
    return new Promise((resolve) => {
      if (!this.socket || !this.socket.connected) {
        resolve({ success: false });
        return;
      }
      this.socket.emit("simulate:step", {}, (response: { success: boolean; event?: OfficeEvent }) => {
        resolve(response || { success: false });
      });
    });
  }
}

export const socketClient = new SocketClient();
