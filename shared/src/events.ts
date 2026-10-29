/**
 * Estados posibles del agente en la oficina virtual.
 */
export type AgentState =
  | "IDLE"
  | "THINKING"
  | "TYPING"
  | "WALKING"
  | "MESSAGING"
  | "ERROR";

/**
 * Tipos de eventos generados por la actividad de los agentes.
 */
export type EventType =
  | "STATE_CHANGE"
  | "MESSAGE_SENT"
  | "TOOL_CALLED"
  | "COLLABORATION_START"
  | "COLLABORATION_END";

/**
 * Tipos de watcher/parser soportados para monitorizar la actividad de los agentes.
 * Extensible a múltiples proveedores y formatos de log locales.
 */
export type WatchType =
  | "antigravity"
  | "claude_code"
  | "opencode"
  | "jsonl_stream"
  | (string & {});

/**
 * Evento emitido por el sistema hacia los clientes Phaser 3 y suscriptores.
 */
export interface OfficeEvent {
  id: string;
  timestamp: string;
  agentId: string;
  type: EventType;
  state: AgentState;
  targetAgentId?: string;
  content?: string;
  toolName?: string;
  /**
   * Proveedor de IA o runtime del agente.
   * Ejemplos: 'Gemini', 'Claude', 'OpenCode', 'Ollama', 'OpenAI', 'local_script', etc.
   */
  provider?: string;
  /**
   * Tipo de parser/watcher asociado al evento.
   */
  watch_type?: WatchType;
  metadata?: Record<string, unknown>;
}
