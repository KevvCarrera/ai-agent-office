import crypto from "node:crypto";
import type { OfficeEvent, AgentState, EventType } from "@office/shared";

export interface LogParser {
  readonly id: string;
  readonly supportedWatchTypes: string[];
  parseLine(rawLine: string, agentId: string, metadata?: Record<string, unknown>): OfficeEvent | null;
}

export function generateEventId(prefix: string = "evt"): string {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
}

export function safeParseJson(raw: string): Record<string, unknown> | null {
  const trimmed = raw.trim();
  if (!trimmed || !trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return null;
  }
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export abstract class BaseLogParser implements LogParser {
  abstract readonly id: string;
  abstract readonly supportedWatchTypes: string[];

  abstract parseLine(
    rawLine: string,
    agentId: string,
    metadata?: Record<string, unknown>
  ): OfficeEvent | null;

  protected buildEvent(params: {
    agentId: string;
    type: EventType;
    state: AgentState;
    content?: string;
    toolName?: string;
    targetAgentId?: string;
    provider?: string;
    watch_type?: string;
    metadata?: Record<string, unknown>;
    timestamp?: string;
  }): OfficeEvent {
    return {
      id: generateEventId(this.id),
      timestamp: params.timestamp || new Date().toISOString(),
      agentId: params.agentId,
      type: params.type,
      state: params.state,
      content: params.content,
      toolName: params.toolName,
      targetAgentId: params.targetAgentId,
      provider: params.provider,
      watch_type: params.watch_type,
      metadata: params.metadata
    };
  }
}
