import { BaseLogParser, safeParseJson } from "./baseParser.js";
import type { OfficeEvent } from "@office/shared";

/**
 * Parser especializado para transcript.jsonl y flujos de Antigravity / Gemini CLI.
 */
export class AntigravityParser extends BaseLogParser {
  readonly id = "antigravity";
  readonly supportedWatchTypes = ["antigravity", "gemini"];

  parseLine(
    rawLine: string,
    agentId: string,
    metadata?: Record<string, unknown>
  ): OfficeEvent | null {
    const trimmed = rawLine.trim();
    if (!trimmed) return null;

    const json = safeParseJson(trimmed);
    if (!json) {
      // Línea de texto plano (fallback)
      if (trimmed.toLowerCase().includes("thinking") || trimmed.toLowerCase().includes("pensando")) {
        return this.buildEvent({
          agentId,
          type: "STATE_CHANGE",
          state: "THINKING",
          content: trimmed,
          provider: "Gemini",
          watch_type: this.id,
          metadata
        });
      }
      if (trimmed.toLowerCase().includes("tool") || trimmed.toLowerCase().includes("herramienta")) {
        return this.buildEvent({
          agentId,
          type: "TOOL_CALLED",
          state: "TYPING",
          content: trimmed,
          provider: "Gemini",
          watch_type: this.id,
          metadata
        });
      }
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "TYPING",
        content: trimmed,
        provider: "Gemini",
        watch_type: this.id,
        metadata
      });
    }

    // 1. Detección de mensajes entre agentes / send_message / invoke_subagent
    const toolCalls = Array.isArray(json.tool_calls)
      ? (json.tool_calls as Array<Record<string, unknown>>)
      : [];

    for (const toolCall of toolCalls) {
      const name = String(toolCall.name || toolCall.tool || "");
      const args = (toolCall.args && typeof toolCall.args === "object" ? toolCall.args : {}) as Record<string, unknown>;

      if (name === "send_message" || name === "invoke_subagent") {
        const recipient = String(args.Recipient || args.recipient || args.target || "agent");
        const msg = String(args.Message || args.message || args.content || "Mensaje enviado");
        return this.buildEvent({
          agentId,
          type: "MESSAGE_SENT",
          state: "MESSAGING",
          targetAgentId: recipient,
          content: msg,
          toolName: name,
          provider: "Gemini",
          watch_type: this.id,
          metadata: { ...metadata, toolCall }
        });
      }

      // Herramienta estándar
      const summary = String(args.toolSummary || args.toolAction || name);
      return this.buildEvent({
        agentId,
        type: "TOOL_CALLED",
        state: "TYPING",
        toolName: name,
        content: summary,
        provider: "Gemini",
        watch_type: this.id,
        metadata: { ...metadata, toolCall }
      });
    }

    // Comprobación si la llamada a herramienta está en la raíz
    if (json.call_tool || json.tool || json.toolName || json.type === "TOOL_CALL") {
      const toolName = String(json.call_tool || json.tool || json.toolName || "tool");
      if (toolName === "send_message" || toolName === "invoke_subagent") {
        const recipient = String(json.recipient || json.target || "agent");
        const msg = String(json.message || json.content || "Mensaje enviado");
        return this.buildEvent({
          agentId,
          type: "MESSAGE_SENT",
          state: "MESSAGING",
          targetAgentId: recipient,
          content: msg,
          toolName,
          provider: "Gemini",
          watch_type: this.id,
          metadata: { ...metadata, ...json }
        });
      }

      const content = String(json.toolSummary || json.toolAction || json.action || `Ejecutando ${toolName}`);
      return this.buildEvent({
        agentId,
        type: "TOOL_CALLED",
        state: "TYPING",
        toolName,
        content,
        provider: "Gemini",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 2. Detección de USER_INPUT
    const typeStr = String(json.type || "").toUpperCase();
    if (typeStr === "USER_INPUT" || json.role === "user") {
      const content = String(json.content || json.message || json.query || "Prompt de usuario recibido");
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "THINKING",
        content,
        provider: "Gemini",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 3. Detección de PLANNER_RESPONSE / Pensamiento
    if (typeStr === "PLANNER_RESPONSE" || json.thought || json.reasoning) {
      const content = String(json.thought || json.reasoning || json.content || "Planificando siguiente paso");
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "THINKING",
        content,
        provider: "Gemini",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 4. Salida de agente / AGENT_RESPONSE
    if (json.content || json.response || json.output) {
      const content = String(json.content || json.response || json.output);
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "TYPING",
        content,
        provider: "Gemini",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 5. Fallback JSON
    return this.buildEvent({
      agentId,
      type: "STATE_CHANGE",
      state: "IDLE",
      content: JSON.stringify(json),
      provider: "Gemini",
      watch_type: this.id,
      metadata: { ...metadata, ...json }
    });
  }
}
