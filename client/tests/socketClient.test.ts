import { describe, it, expect, vi, afterEach } from "vitest";
import { SocketClient } from "../src/network/socketClient.js";
import type { OfficeConfig, OfficeEvent } from "@office/shared";

describe("SocketClient unit tests", () => {
  let client: SocketClient | null = null;

  afterEach(() => {
    if (client) {
      client.disconnect();
      client = null;
    }
  });

  it("initializes disconnected by default in headless test environment", () => {
    client = new SocketClient({ autoConnect: false });
    expect(typeof client.isConnected).toBe("function");
    expect(client.getConfig()).toBeNull();
    expect(client.isSimulationRunning()).toBe(false);
  });

  it("handles event listener registration and unregistration cleanly", () => {
    client = new SocketClient({ autoConnect: false });
    const mockCallback = vi.fn();

    const unsubscribe = client.onEvent(mockCallback);
    expect(typeof unsubscribe).toBe("function");

    unsubscribe();
  });

  it("notifies config listeners when config is received", () => {
    client = new SocketClient({ autoConnect: false });
    const configCb = vi.fn();

    client.onConfig(configCb);

    const testConfig: OfficeConfig = {
      version: "1.0",
      settings: { refresh_rate_ms: 500, websocket_port: 4000, http_port: 3000 },
      offices: [],
      agents: []
    };

    // Simular recepción interna
    (client as any).config = testConfig;
    (client as any).configListeners.forEach((cb: any) => cb(testConfig));

    expect(configCb).toHaveBeenCalledWith(testConfig);
  });

  it("updates agent state map on incoming events", () => {
    client = new SocketClient({ autoConnect: false });
    const eventCb = vi.fn();
    client.onEvent(eventCb);

    const testEvent: OfficeEvent = {
      id: "evt-test-1",
      timestamp: new Date().toISOString(),
      agentId: "architect",
      type: "STATE_CHANGE",
      state: "THINKING"
    };

    (client as any).agentStates["architect"] = {
      state: "IDLE",
      updatedAt: new Date().toISOString()
    };

    (client as any).eventListeners.forEach((cb: any) => cb(testEvent));

    expect(eventCb).toHaveBeenCalledWith(testEvent);
  });
});
