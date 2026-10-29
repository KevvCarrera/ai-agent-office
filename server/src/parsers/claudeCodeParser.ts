import { BaseLogParser, safeParseJson } from "./baseParser.js";
import type { OfficeEvent } from "@office/shared";

/**
 * Parser especializado para logs generados por Claude Code CLI.
 */
export class ClaudeCodeParser extends BaseLogParser {
  readonly id = "claude_code";
  readonly supportedWatchTypes = ["claude_code", "claude"];

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

    // 1. Tool use / tool_call
    if (json.type === "tool_use" || json.type === "tool_call" || json.tool_name || json.tool) {
      const toolName = String(json.name || json.tool_name || json.tool || "tool");
      const input = (json.input && typeof json.input === "object" ? json.input : {}) as Record<string, unknown>;

      if (toolName === "send_message" || toolName === "message_agent" || toolName === "collaborate") {
        const recipient = String(input.recipient || input.agentId || input.to || "agent");
        const msg = String(input.message || input.content || "Mensaje enviado");
        return this.buildEvent({
          agentId,
          type: "MESSAGE_SENT",
          state: "MESSAGING",
          targetAgentId: recipient,
          content: msg,
          toolName,
          provider: "Claude",
          watch_type: this.id,
          metadata: { ...metadata, ...json }
        });
      }

      const content = String(input.description || input.command || input.query || `Ejecutando ${toolName}`);
      return this.buildEvent({
        agentId,
        type: "TOOL_CALLED",
        state: "TYPING",
        toolName,
        content,
        provider: "Claude",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 2. Pensamiento / razonamiento
    if (json.type === "thinking" || json.type === "thought" || json.thinking) {
      const content = String(json.content || json.thinking || json.thought || "Razonando solución...");
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "THINKING",
        content,
        provider: "Claude",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 3. Mensajes entre agentes en JSON
    if (json.type === "message_sent" || json.recipient) {
      const recipient = String(json.recipient || json.to || "agent");
      const msg = String(json.message || json.content || "Colaborando");
      return this.buildEvent({
        agentId,
        type: "MESSAGE_SENT",
        state: "MESSAGING",
        targetAgentId: recipient,
        content: msg,
        provider: "Claude",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    // 4. Mensaje de asistente / escritura
    if (json.type === "message" || json.role === "assistant" || json.content) {
      let content = "";
      if (typeof json.content === "string") {
        content = json.content;
      } else if (Array.isArray(json.content)) {
        content = json.content.map((item) => (typeof item === "string" ? item : (item as { text?: string }).text || "")).join(" ");
      } else {
        content = "Generando respuesta...";
      }

      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "TYPING",
        content,
        provider: "Claude",
        watch_type: this.id,
        metadata: { ...metadata, ...json }
      });
    }

    return this.buildEvent({
      agentId,
      type: "STATE_CHANGE",
      state: "IDLE",
      content: JSON.stringify(json),
      provider: "Claude",
      watch_type: this.id,
      metadata: { ...metadata, ...json }
    });
  }

  private parsePlainText(
    line: string,
    agentId: string,
    metadata?: Record<string, unknown>
  ): OfficeEvent {
    // Patrones de logs textuales comunes en CLI
    const toolMatch = line.match(/\[(?:Tool|ToolCall|ToolUse):\s*([^\]]+)\]\s*(.*)/i);
    if (toolMatch) {
      const toolName = toolMatch[1].trim();
      const content = toolMatch[2]?.trim() || `Ejecutando ${toolName}`;
      return this.buildEvent({
        agentId,
        type: "TOOL_CALLED",
        state: "TYPING",
        toolName,
        content,
        provider: "Claude",
        watch_type: this.id,
        metadata
      });
    }

    const messageMatch = line.match(/\[Message\s*(?:->|to)\s*([a-zA-Z0-9_-]+)\]\s*(.*)/i);
    if (messageMatch) {
      const targetAgentId = messageMatch[1].trim();
      const content = messageMatch[2]?.trim() || "Mensaje enviado";
      return this.buildEvent({
        agentId,
        type: "MESSAGE_SENT",
        state: "MESSAGING",
        targetAgentId,
        content,
        provider: "Claude",
        watch_type: this.id,
        metadata
      });
    }

    const thinkingMatch = line.match(/\[(?:Thinking|Thought)\]\s*(.*)/i);
    if (thinkingMatch) {
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "THINKING",
        content: thinkingMatch[1].trim() || "Pensando...",
        provider: "Claude",
        watch_type: this.id,
        metadata
      });
    }

    if (line.toLowerCase().includes("error") || line.toLowerCase().includes("fail")) {
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "ERROR",
        content: line,
        provider: "Claude",
        watch_type: this.id,
        metadata
      });
    }

    return this.buildEvent({
      agentId,
      type: "STATE_CHANGE",
      state: "TYPING",
      content: line,
      provider: "Claude",
      watch_type: this.id,
      metadata
    });
  }
}
