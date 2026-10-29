import { describe, it, expect } from "vitest";
import path from "node:path";
import fs from "node:fs";
import {
  loadOfficeConfig,
  validateConfig,
  inferProvider,
  inferWatchType,
  findConfigPath
} from "../src/config/configLoader.js";

describe("ConfigLoader", () => {
  it("debe cargar la configuración de office.config.yaml en la raíz del proyecto", () => {
    const config = loadOfficeConfig();
    expect(config).toBeDefined();
    expect(config.version).toBe("1.0");
    expect(config.settings).toBeDefined();
    expect(config.settings.websocket_port).toBe(4000);
    expect(config.offices.length).toBeGreaterThanOrEqual(1);
    expect(config.agents.length).toBeGreaterThanOrEqual(1);

    const architect = config.agents.find((a) => a.id === "architect");
    expect(architect).toBeDefined();
    expect(architect?.provider).toBe("Claude");
    expect(architect?.watch_type).toBe("claude_code");
  });

  it("debe validar correctamente un objeto de configuración válido", () => {
    const raw = {
      version: "2.0",
      settings: {
        refresh_rate_ms: 1000,
        websocket_port: 5000,
        http_port: 8080
      },
      offices: [
        {
          id: "room_1",
          name: "Sala Principal",
          desk_coords: { x: 5, y: 5 },
          assigned_agent: "agent_1"
        }
      ],
      agents: [
        {
          id: "agent_1",
          name: "Agente 1",
          model: "gemini-2.5-flash",
          sprite: "avatar_green",
          watch_target: "logs/agent1.jsonl"
        }
      ]
    };

    const validated = validateConfig(raw);
    expect(validated.version).toBe("2.0");
    expect(validated.settings.websocket_port).toBe(5000);
    expect(validated.offices[0].name).toBe("Sala Principal");
    expect(validated.agents[0].provider).toBe("Gemini");
    expect(validated.agents[0].watch_type).toBe("antigravity");
  });

  it("debe lanzar error si 'offices' o 'agents' no son arrays válidos", () => {
    expect(() => validateConfig({ version: "1.0", offices: "not-an-array", agents: [] })).toThrow(
      "[ConfigLoader] 'offices' debe ser un array"
    );

    expect(() => validateConfig({ version: "1.0", offices: [], agents: "invalid" })).toThrow(
      "[ConfigLoader] 'agents' debe ser un array"
    );
  });

  it("debe lanzar error si faltan campos obligatorios en una oficina o agente", () => {
    expect(() =>
      validateConfig({
        offices: [{ id: "o1", name: "Room", desk_coords: { x: "no-num", y: 2 }, assigned_agent: "a1" }],
        agents: []
      })
    ).toThrow();

    expect(() =>
      validateConfig({
        offices: [{ id: "o1", name: "Room", desk_coords: { x: 1, y: 2 }, assigned_agent: "a1" }],
        agents: [{ id: "a1", name: "Agent" }]
      })
    ).toThrow();
  });

  it("debe inferir correctamente el proveedor y watch_type según el modelo", () => {
    expect(inferProvider("Claude 3.7 Sonnet", "logs/arch.jsonl")).toBe("Claude");
    expect(inferProvider("Gemini 2.5 Flash", "logs/dev.jsonl")).toBe("Gemini");
    expect(inferProvider("OpenCode Agent", "logs/opencode.log")).toBe("OpenCode");
    expect(inferProvider("Ollama llama3", "logs/model.log")).toBe("Ollama");
    expect(inferProvider("Custom Model", "logs/custom.log")).toBe("Generic");

    expect(inferWatchType("Claude Code CLI", "logs/arch.jsonl")).toBe("claude_code");
    expect(inferWatchType("Gemini Flash", "logs/transcript.jsonl")).toBe("antigravity");
    expect(inferWatchType("OpenCode Runtime", "logs/opencode.jsonl")).toBe("opencode");
    expect(inferWatchType("Unknown", "logs/generic.jsonl")).toBe("jsonl_stream");
  });

  it("debe lanzar error cuando findConfigPath recibe una ruta inexistente", () => {
    expect(() => findConfigPath("/ruta/que/no/existe/office.config.yaml")).toThrow(
      "[ConfigLoader] Archivo de configuración no encontrado"
    );
  });
});
