import { BaseLogParser, safeParseJson } from "./baseParser.js";
import type { OfficeEvent, AgentState, EventType } from "@office/shared";

const VALID_STATES: AgentState[] = ["IDLE", "THINKING", "TYPING", "WALKING", "MESSAGING", "ERROR"];
const VALID_TYPES: EventType[] = ["STATE_CHANGE", "MESSAGE_SENT", "TOOL_CALLED", "COLLABORATION_START", "COLLABORATION_END"];

/**
 * Parser universal para archivos office-events.jsonl o cualquier formato JSONL plano.
 */
export class GenericJsonlParser extends BaseLogParser {
  readonly id = "generic_jsonl";
  readonly supportedWatchTypes = ["jsonl_stream", "generic", "generic_jsonl"];

  parseLine(
    rawLine: string,
    agentId: string,
    metadata?: Record<string, unknown>
  ): OfficeEvent | null {
    const trimmed = rawLine.trim();
    if (!trimmed) return null;

    const json = safeParseJson(trimmed);
    if (!json) {
      return this.buildEvent({
        agentId,
        type: "STATE_CHANGE",
        state: "TYPING",
        content: trimmed,
        provider: "Generic",
        watch_type: this.id,
        metadata
      });
    }

    const resolvedAgentId = typeof json.agentId === "string" && json.agentId.trim() ? json.agentId.trim() : agentId;

    let resolvedState: AgentState = "TYPING";
    if (typeof json.state === "string" && VALID_STATES.includes(json.state.toUpperCase() as AgentState)) {
      resolvedState = json.state.toUpperCase() as AgentState;
    } else if (typeof json.status === "string" && VALID_STATES.includes(json.status.toUpperCase() as AgentState)) {
      resolvedState = json.status.toUpperCase() as AgentState;
    }

    let resolvedType: EventType = "STATE_CHANGE";
    if (typeof json.type === "string" && VALID_TYPES.includes(json.type.toUpperCase() as EventType)) {
      resolvedType = json.type.toUpperCase() as EventType;
    } else if (resolvedState === "MESSAGING" || json.targetAgentId) {
      resolvedType = "MESSAGE_SENT";
    } else if (json.toolName || json.tool) {
      resolvedType = "TOOL_CALLED";
    }

    const content = typeof json.content === "string"
      ? json.content
      : typeof json.message === "string"
      ? json.message
      : typeof json.text === "string"
      ? json.text
      : undefined;

    const toolName = typeof json.toolName === "string"
      ? json.toolName
      : typeof json.tool === "string"
      ? json.tool
      : undefined;

    const targetAgentId = typeof json.targetAgentId === "string"
      ? json.targetAgentId
      : typeof json.recipient === "string"
      ? json.recipient
      : undefined;

    const provider = typeof json.provider === "string" ? json.provider : "Generic";
    const timestamp = typeof json.timestamp === "string" ? json.timestamp : new Date().toISOString();

    const mergedMetadata = {
      ...metadata,
      ...(json.metadata && typeof json.metadata === "object" ? (json.metadata as Record<string, unknown>) : {})
    };

    return this.buildEvent({
      agentId: resolvedAgentId,
      type: resolvedType,
      state: resolvedState,
      content,
      toolName,
      targetAgentId,
      provider,
      watch_type: this.id,
      timestamp,
      metadata: Object.keys(mergedMetadata).length > 0 ? mergedMetadata : undefined
    });
  }
}
