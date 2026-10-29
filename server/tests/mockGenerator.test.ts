import { describe, it, expect, vi } from "vitest";
import { MockGenerator } from "../src/simulator/mockGenerator.js";
import type { OfficeConfig, OfficeEvent } from "@office/shared";

describe("MockGenerator", () => {
  const dummyConfig: OfficeConfig = {
    version: "1.0",
    settings: { refresh_rate_ms: 500, websocket_port: 4000, http_port: 3000 },
    offices: [],
    agents: [
      {
        id: "architect",
        name: "Architect Agent",
        model: "Claude 3.7",
        sprite: "avatar_blue",
        watch_target: "logs/arch.log"
      },
      {
        id: "backend-developer",
        name: "Backend Developer",
        model: "Gemini Flash",
        sprite: "avatar_green",
        watch_target: "logs/dev.log"
      },
      {
        id: "qa-engineer",
        name: "QA Specialist",
        model: "Claude Haiku",
        sprite: "avatar_purple",
        watch_target: "logs/qa.log"
      }
    ]
  };

  it("debe generar un ciclo completo de eventos narrativos válidos con emitSingleCycle", () => {
    const generator = new MockGenerator(dummyConfig);
    const events = generator.emitSingleCycle();

    expect(events.length).toBeGreaterThanOrEqual(10);

    // Verificar que todos los eventos son válidos
    for (const evt of events) {
      expect(evt.id).toMatch(/^mock-/);
      expect(evt.timestamp).toBeDefined();
      expect(evt.agentId).toBeDefined();
      expect(["IDLE", "THINKING", "TYPING", "WALKING", "MESSAGING", "ERROR"]).toContain(evt.state);
      expect(["STATE_CHANGE", "MESSAGE_SENT", "TOOL_CALLED", "COLLABORATION_START", "COLLABORATION_END"]).toContain(evt.type);
    }

    // Verificar narrativa básica del ciclo
    const firstEvent = events[0];
    expect(firstEvent.state).toBe("THINKING");

    const walkingEvent = events.find((e) => e.state === "WALKING");
    expect(walkingEvent).toBeDefined();
    expect(walkingEvent?.type).toBe("MESSAGE_SENT");

    const collabEvent = events.find((e) => e.type === "COLLABORATION_START");
    expect(collabEvent).toBeDefined();

    const lastEvent = events[events.length - 1];
    expect(lastEvent.state).toBe("IDLE");
  });

  it("debe emitir eventos paso a paso con emitSingleStep", () => {
    const generator = new MockGenerator(dummyConfig);
    const capturedEvents: OfficeEvent[] = [];

    const unsubscribe = generator.onEvent((evt) => {
      capturedEvents.push(evt);
    });

    const step1 = generator.emitSingleStep();
    const step2 = generator.emitSingleStep();

    expect(step1).toBeDefined();
    expect(step2).toBeDefined();
    expect(capturedEvents.length).toBe(2);
    expect(capturedEvents[0].id).toBe(step1.id);
    expect(capturedEvents[1].id).toBe(step2.id);

    unsubscribe();
  });

  it("debe gestionar el ciclo de vida con start() y stop()", () => {
    vi.useFakeTimers();

    const generator = new MockGenerator(dummyConfig);
    expect(generator.isRunning()).toBe(false);

    generator.start(1000);
    expect(generator.isRunning()).toBe(true);

    vi.advanceTimersByTime(2500);

    generator.stop();
    expect(generator.isRunning()).toBe(false);

    vi.useRealTimers();
  });
});
