import { describe, it, expect } from "vitest";
import {
  AntigravityParser,
  ClaudeCodeParser,
  OpenCodeParser,
  GenericJsonlParser,
  ParserRegistry
} from "../src/parsers/index.js";

describe("Parsers Multi-Proveedor", () => {
  describe("AntigravityParser", () => {
    const parser = new AntigravityParser();

    it("debe retornar null para líneas vacías", () => {
      expect(parser.parseLine("", "agent-1")).toBeNull();
      expect(parser.parseLine("   \n", "agent-1")).toBeNull();
    });

    it("debe parsear USER_INPUT como STATE_CHANGE (THINKING)", () => {
      const line = JSON.stringify({
        type: "USER_INPUT",
        content: "Crea un servidor Socket.io en Node.js"
      });
      const event = parser.parseLine(line, "gemini-agent");

      expect(event).toBeDefined();
      expect(event?.agentId).toBe("gemini-agent");
      expect(event?.type).toBe("STATE_CHANGE");
      expect(event?.state).toBe("THINKING");
      expect(event?.content).toContain("Crea un servidor");
      expect(event?.provider).toBe("Gemini");
    });

    it("debe parsear llamadas a herramientas (TOOL_CALLED)", () => {
      const line = JSON.stringify({
        tool_calls: [
          {
            name: "run_command",
            args: { CommandLine: "npm test", toolSummary: "Ejecución de tests" }
          }
        ]
      });
      const event = parser.parseLine(line, "gemini-agent");

      expect(event).toBeDefined();
      expect(event?.type).toBe("TOOL_CALLED");
      expect(event?.state).toBe("TYPING");
      expect(event?.toolName).toBe("run_command");
      expect(event?.content).toBe("Ejecución de tests");
    });

    it("debe detectar comunicación entre subagentes vía send_message", () => {
      const line = JSON.stringify({
        tool_calls: [
          {
            name: "send_message",
            args: {
              Recipient: "qa-specialist",
              Message: "Por favor audita la implementación del Hito 2"
            }
          }
        ]
      });
      const event = parser.parseLine(line, "backend-dev");

      expect(event).toBeDefined();
      expect(event?.type).toBe("MESSAGE_SENT");
      expect(event?.state).toBe("MESSAGING");
      expect(event?.targetAgentId).toBe("qa-specialist");
      expect(event?.content).toContain("Por favor audita");
    });

    it("debe parsear líneas de texto plano con thinking o tool", () => {
      const thinkingEvent = parser.parseLine("[Gemini] Thinking about database migration", "agent-1");
      expect(thinkingEvent?.state).toBe("THINKING");

      const toolEvent = parser.parseLine("Calling tool: execute_script", "agent-1");
      expect(toolEvent?.type).toBe("TOOL_CALLED");
    });
  });

  describe("ClaudeCodeParser", () => {
    const parser = new ClaudeCodeParser();

    it("debe parsear tool_use de Claude Code", () => {
      const line = JSON.stringify({
        type: "tool_use",
        name: "write_file",
        input: { path: "server/src/index.ts", description: "Creando servidor WebSocket" }
      });
      const event = parser.parseLine(line, "claude-agent");

      expect(event).toBeDefined();
      expect(event?.type).toBe("TOOL_CALLED");
      expect(event?.state).toBe("TYPING");
      expect(event?.toolName).toBe("write_file");
      expect(event?.content).toContain("Creando servidor");
      expect(event?.provider).toBe("Claude");
    });

    it("debe parsear bloques de pensamiento (thinking)", () => {
      const line = JSON.stringify({
        type: "thinking",
        content: "Evaluando alternativas arquitectónicas para el watcher..."
      });
      const event = parser.parseLine(line, "claude-agent");

      expect(event).toBeDefined();
      expect(event?.type).toBe("STATE_CHANGE");
      expect(event?.state).toBe("THINKING");
      expect(event?.content).toContain("Evaluando alternativas");
    });

    it("debe parsear patrones de log textual como [Tool: ...] o [Message -> ...]", () => {
      const toolLine = "[Tool: EditFile] index.ts modificado con éxito";
      const toolEvent = parser.parseLine(toolLine, "claude-agent");
      expect(toolEvent?.type).toBe("TOOL_CALLED");
      expect(toolEvent?.toolName).toBe("EditFile");

      const msgLine = "[Message -> backend-dev] Por favor revisa la spec actualizada";
      const msgEvent = parser.parseLine(msgLine, "architect");
      expect(msgEvent?.type).toBe("MESSAGE_SENT");
      expect(msgEvent?.state).toBe("MESSAGING");
      expect(msgEvent?.targetAgentId).toBe("backend-dev");
      expect(msgEvent?.content).toContain("Por favor revisa");
    });
  });

  describe("OpenCodeParser", () => {
    const parser = new OpenCodeParser();

    it("debe parsear evento task_started como THINKING", () => {
      const line = JSON.stringify({
        event: "task_started",
        data: { description: "Refactorizando arquitectura modular" }
      });
      const event = parser.parseLine(line, "opencode-agent");

      expect(event).toBeDefined();
      expect(event?.type).toBe("STATE_CHANGE");
      expect(event?.state).toBe("THINKING");
      expect(event?.content).toContain("Refactorizando");
    });

    it("debe parsear llamadas a herramientas de OpenCode", () => {
      const line = JSON.stringify({
        event: "tool_call",
        data: { tool: "bash_exec", command: "git status" }
      });
      const event = parser.parseLine(line, "opencode-agent");

      expect(event).toBeDefined();
      expect(event?.type).toBe("TOOL_CALLED");
      expect(event?.toolName).toBe("bash_exec");
    });

    it("debe parsear eventos de error", () => {
      const line = JSON.stringify({
        event: "error",
        data: { error: "Fallo de conexión al daemon" }
      });
      const event = parser.parseLine(line, "opencode-agent");

      expect(event).toBeDefined();
      expect(event?.state).toBe("ERROR");
    });
  });

  describe("GenericJsonlParser", () => {
    const parser = new GenericJsonlParser();

    it("debe parsear objetos JSONL directos con campos de OfficeEvent", () => {
      const line = JSON.stringify({
        agentId: "custom-agent",
        state: "WALKING",
        type: "MESSAGE_SENT",
        targetAgentId: "desk-3",
        content: "Caminando al despacho del desarrollador"
      });
      const event = parser.parseLine(line, "fallback-agent");

      expect(event).toBeDefined();
      expect(event?.agentId).toBe("custom-agent");
      expect(event?.state).toBe("WALKING");
      expect(event?.type).toBe("MESSAGE_SENT");
      expect(event?.targetAgentId).toBe("desk-3");
    });

    it("debe asignar valores por defecto para campos omitidos", () => {
      const line = JSON.stringify({ message: "Hola mundo" });
      const event = parser.parseLine(line, "default-agent");

      expect(event).toBeDefined();
      expect(event?.agentId).toBe("default-agent");
      expect(event?.state).toBe("TYPING");
      expect(event?.content).toBe("Hola mundo");
    });
  });

  describe("ParserRegistry", () => {
    it("debe resolver el parser adecuado según watch_type o metadata del agente", () => {
      const registry = new ParserRegistry();

      const claudeParser = registry.getParser("claude_code");
      expect(claudeParser.id).toBe("claude_code");

      const geminiParser = registry.getParser("antigravity");
      expect(geminiParser.id).toBe("antigravity");

      const opencodeParser = registry.getParser("opencode");
      expect(opencodeParser.id).toBe("opencode");

      const fallback = registry.getParser("formato_desconocido");
      expect(fallback.id).toBe("generic_jsonl");

      const resolved = registry.resolveParserForAgent({
        id: "agent-x",
        name: "Agent X",
        model: "Claude 3.7 Sonnet",
        sprite: "avatar_blue",
        watch_target: "logs/agent-x.log"
      });
      expect(resolved.id).toBe("claude_code");
    });
  });
});
