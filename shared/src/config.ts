import type { WatchType } from "./events.js";

/**
 * Coordenadas de posición en la cuadrícula (grid) de la oficina virtual.
 */
export interface DeskCoords {
  x: number;
  y: number;
}

/**
 * Configuración de un despacho o sala de oficina.
 */
export interface OfficeRoom {
  id: string;
  name: string;
  desk_coords: DeskCoords;
  assigned_agent: string;
}

/**
 * Metadatos y configuración de monitoreo de un agente.
 */
export interface AgentMetadata {
  id: string;
  name: string;
  model: string;
  sprite: string;
  watch_target: string;
  /**
   * Proveedor de IA del agente (ej. 'Gemini', 'Claude', 'OpenCode', 'Ollama', 'OpenAI', etc.)
   */
  provider?: string;
  /**
   * Tipo de watcher/parser asignado a este agente.
   */
  watch_type?: WatchType;
}

/**
 * Ajustes de red y refresco del daemon.
 */
export interface OfficeSettings {
  refresh_rate_ms: number;
  websocket_port: number;
  http_port: number;
}

/**
 * Configuración global del espacio de trabajo de la oficina (cargado desde office.config.yaml).
 */
export interface OfficeConfig {
  version: string;
  settings: OfficeSettings;
  offices: OfficeRoom[];
  agents: AgentMetadata[];
}
