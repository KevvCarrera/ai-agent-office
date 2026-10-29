import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createOfficeServer, type ServerInstance } from "../src/index.js";

describe("REST Endpoints y Servidor", () => {
  let serverInstance: ServerInstance;
  let baseUrl: string;

  beforeAll(async () => {
    // Inicializar servidor en puerto dinámico asignado por el SO (port 0)
    serverInstance = createOfficeServer();

    await new Promise<void>((resolve, reject) => {
      serverInstance.httpServer.listen(0, "127.0.0.1", () => {
        const addr = serverInstance.httpServer.address();
        if (typeof addr === "object" && addr !== null) {
          baseUrl = `http://127.0.0.1:${addr.port}`;
        }
        resolve();
      });
      serverInstance.httpServer.on("error", reject);
    });
  });

  afterAll(async () => {
    await serverInstance.close();
  });

  it("GET /health debe retornar estado ok y datos de simulación", async () => {
    const res = await fetch(`${baseUrl}/health`);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.service).toBe("ai-agent-office-daemon");
    expect(data.simulation).toBeDefined();
    expect(typeof data.simulation.running).toBe("boolean");
  });

  it("GET /api/config debe retornar la configuración de la oficina", async () => {
    const res = await fetch(`${baseUrl}/api/config`);
    expect(res.status).toBe(200);

    const config = await res.json();
    expect(config.version).toBeDefined();
    expect(config.settings).toBeDefined();
    expect(Array.isArray(config.agents)).toBe(true);
  });

  it("POST /api/simulate/start y POST /api/simulate/stop deben controlar la simulación", async () => {
    const startRes = await fetch(`${baseUrl}/api/simulate/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intervalMs: 1000 })
    });
    expect(startRes.status).toBe(200);
    const startData = await startRes.json();
    expect(startData.success).toBe(true);
    expect(startData.running).toBe(true);
    expect(serverInstance.mockGenerator.isRunning()).toBe(true);

    const stopRes = await fetch(`${baseUrl}/api/simulate/stop`, {
      method: "POST"
    });
    expect(stopRes.status).toBe(200);
    const stopData = await stopRes.json();
    expect(stopData.success).toBe(true);
    expect(stopData.running).toBe(false);
    expect(serverInstance.mockGenerator.isRunning()).toBe(false);
  });

  it("POST /api/simulate/step debe emitir un único paso narrativo", async () => {
    const res = await fetch(`${baseUrl}/api/simulate/step`, {
      method: "POST"
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.event).toBeDefined();
    expect(data.event.id).toBeDefined();
    expect(data.event.agentId).toBeDefined();
    expect(data.event.state).toBeDefined();
  });
});
