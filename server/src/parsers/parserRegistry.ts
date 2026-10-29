import type { AgentMetadata } from "@office/shared";
import type { LogParser } from "./baseParser.js";
import { AntigravityParser } from "./antigravityParser.js";
import { ClaudeCodeParser } from "./claudeCodeParser.js";
import { OpenCodeParser } from "./openCodeParser.js";
import { GenericJsonlParser } from "./genericJsonlParser.js";

/**
 * Registro y fábrica de parsers para mapear agentes y tipos de watcher al parser correspondiente.
 */
export class ParserRegistry {
  private parsers: Map<string, LogParser> = new Map();
  private defaultParser: LogParser;

  constructor() {
    this.defaultParser = new GenericJsonlParser();
    this.registerDefaults();
  }

  private registerDefaults(): void {
    this.register(new AntigravityParser());
    this.register(new ClaudeCodeParser());
    this.register(new OpenCodeParser());
    this.register(this.defaultParser);
  }

  /**
   * Registra un nuevo parser asociándolo a su id y sus supportedWatchTypes.
   */
  register(parser: LogParser): void {
    this.parsers.set(parser.id.toLowerCase(), parser);
    for (const watchType of parser.supportedWatchTypes) {
      this.parsers.set(watchType.toLowerCase(), parser);
    }
  }

  /**
   * Obtiene un parser por identificador, watch_type o provider.
   */
  getParser(identifier?: string): LogParser {
    if (!identifier) return this.defaultParser;
    const lower = identifier.toLowerCase().trim();
    return this.parsers.get(lower) || this.defaultParser;
  }

  /**
   * Resuelve el parser más adecuado para un agente evaluando watch_type, provider, ruta o modelo.
   */
  resolveParserForAgent(agent: AgentMetadata): LogParser {
    if (agent.watch_type && this.parsers.has(agent.watch_type.toLowerCase())) {
      return this.parsers.get(agent.watch_type.toLowerCase())!;
    }

    if (agent.provider && this.parsers.has(agent.provider.toLowerCase())) {
      return this.parsers.get(agent.provider.toLowerCase())!;
    }

    const target = (agent.watch_target || "").toLowerCase();
    if (target.includes("antigravity") || target.includes("transcript") || target.includes("gemini")) {
      return this.parsers.get("antigravity") || this.defaultParser;
    }
    if (target.includes("claude")) {
      return this.parsers.get("claude_code") || this.defaultParser;
    }
    if (target.includes("opencode")) {
      return this.parsers.get("opencode") || this.defaultParser;
    }

    const model = (agent.model || "").toLowerCase();
    if (model.includes("gemini")) {
      return this.parsers.get("antigravity") || this.defaultParser;
    }
    if (model.includes("claude")) {
      return this.parsers.get("claude_code") || this.defaultParser;
    }
    if (model.includes("opencode")) {
      return this.parsers.get("opencode") || this.defaultParser;
    }

    return this.defaultParser;
  }

  /**
   * Retorna la lista única de parsers instanciados.
   */
  getAllParsers(): LogParser[] {
    return Array.from(new Set(this.parsers.values()));
  }
}

export const defaultParserRegistry = new ParserRegistry();
