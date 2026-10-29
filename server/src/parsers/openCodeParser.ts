import { BaseLogParser, safeParseJson } from "./baseParser.js";
import type { OfficeEvent } from "@office/shared";

/**
 * Parser especializado para eventos y logs del runtime OpenCode.
 */
export class OpenCodeParser extends BaseLogParser {
  readonly id = "opencode";
  readonly supportedWatchTypes = ["opencode"];

  parseLine(
    rawLine: string,
    agentId: string,
    metadata?: Record<string, unknown>
  ): OfficeEvent | null {
    const trimmed = rawLine.trim();
    if (!trimmed) return null;

    const json = safeParseJson(trimmed);
    if (!json) {
      return this.parsePlainText(trimmed, agentId, metadata);
    }

    const eventName = String(json.event || json.type || "").toLowerCase();
    const data = (json.data && typeof json.data === "object" ? json.data : json) as Record<string, unknown>;

    // 1. Mensaje entre agentes / colaboración
    if (eventName === "message" || eventName === "send_message" || eventName === "collaborate" || data.recipient) {
      const recipient = String(data.recipient || data.target || "agent");
      const msg = String(data.message || data.content || "Mensaje OpenCode");
      return this.buildEvent({
        agentId,
        type: "MESSAGE_SENT",
        state: "MESSAGING",
        targetAgentId: recipient,
        content: msg,
        provider: "OpenCode",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 2. Llamada a herramienta / tool
    if (eventName === "tool_call" || eventName === "tool" || data.tool || data.tool_name) {
      const toolName = String(data.tool || data.tool_name || data.name || "openCodeTool");
      const content = String(data.summary || data.description || data.command || `Ejecutando ${toolName}`);
      return this.buildEvent({
        agentId,
        type: "TOOL_CALLED",
        state: "TYPING",
        toolName,
        content,
        provider: "OpenCode",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 3. Pensamiento / inicio de tarea
    if (eventName === "task_started" || eventName === "plan" || eventName === "thinking" || data.step) {
      const content = String(data.description || data.thought || data.task || "Planificando tarea en OpenCode");
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "THINKING",
        content,
        provider: "OpenCode",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 4. Finalización / Idle
    if (eventName === "completed" || eventName === "idle" || data.status === "completed") {
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "IDLE",
        content: String(data.result || "Tarea completada con éxito"),
        provider: "OpenCode",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 5. Error
    if (eventName === "error" || data.status === "failed" || data.error) {
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "ERROR",
        content: String(data.error || data.message || "Error en ejecución OpenCode"),
        provider: "OpenCode",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 6. Actividad general / escritura
    const content = String(data.content || data.output || data.text || "Procesando...");
    return this.buildEvent({
      agentId,
      type: "STATE_CHANGE",
      state: "TYPING",
      content,
      provider: "OpenCode",
      watch_type: this.id,
      metadata: { ...metadata, ...json }
    });
  }

  private parsePlainText(
    line: string,
    agentId: string,
    metadata?: Record<string, unknown>
  ): OfficeEvent {
    if (line.toLowerCase().includes("error") || line.toLowerCase().includes("fail")) {
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "ERROR",
        content: line,
        provider: "OpenCode",
        watch_type: this.id,
        metadata
      });
    }

    if (line.toLowerCase().includes("thinking") || line.toLowerCase().includes("planning")) {
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "THINKING",
        content: line,
        provider: "OpenCode",
        watch_type: this.id,
        metadata
      });
    }

    return this.buildEvent({
      agentId,
      type: "STATE_CHANGE",
      state: "TYPING",
      content: line,
      provider: "OpenCode",
      watch_type: this.id,
      metadata
    });
  }
}
