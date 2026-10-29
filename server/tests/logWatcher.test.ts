import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { LogWatcher } from "../src/watchers/logWatcher.js";
import type { OfficeEvent } from "@office/shared";

describe("LogWatcher (Tail -f Incremental)", () => {
  let tmpDir: string;
  let testLogFile: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "office-watcher-test-"));
    testLogFile = path.join(tmpDir, "test-agent.jsonl");
    fs.writeFileSync(testLogFile, "", "utf-8");
  });

  afterEach(() => {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignorar errores de cleanup en Windows
    }
  });

  it("debe leer de forma incremental solo las líneas añadidas", async () => {
    const watcher = new LogWatcher({
      baseDir: tmpDir,
      readFromBeginning: true
    });

    watcher.addAgent({
      id: "agent-watcher-test",
      name: "Test Agent",
      model: "Claude 3.7",
      sprite: "avatar_blue",
      watch_target: testLogFile,
      watch_type: "claude_code"
    });

    const receivedEvents: OfficeEvent[] = [];
    watcher.onEvent((evt) => {
      receivedEvents.push(evt);
    });

    // 1. Escribir primera línea
    const firstLine = JSON.stringify({ type: "thinking", content: "Analizando fichero..." }) + "\n";
    fs.appendFileSync(testLogFile, firstLine, "utf-8");
    watcher.handleFileChange(testLogFile);

    expect(receivedEvents.length).toBe(1);
    expect(receivedEvents[0].state).toBe("THINKING");
    expect(receivedEvents[0].content).toContain("Analizando fichero");

    // 2. Escribir segunda línea
    const secondLine = JSON.stringify({ type: "tool_use", name: "write_file", input: { path: "main.ts" } }) + "\n";
    fs.appendFileSync(testLogFile, secondLine, "utf-8");
    watcher.handleFileChange(testLogFile);

    // Debe haber recibido únicamente el segundo evento (total 2) sin duplicar el primero
    expect(receivedEvents.length).toBe(2);
    expect(receivedEvents[1].type).toBe("TOOL_CALLED");
    expect(receivedEvents[1].toolName).toBe("write_file");

    await watcher.stop();
  });

  it("debe reiniciar offset si el archivo es truncado o recreado", async () => {
    const watcher = new LogWatcher({
      baseDir: tmpDir,
      readFromBeginning: true
    });

    watcher.addAgent({
      id: "agent-trunc-test",
      name: "Trunc Agent",
      model: "Gemini Flash",
      sprite: "avatar_green",
      watch_target: testLogFile,
      watch_type: "antigravity"
    });

    const events: OfficeEvent[] = [];
    watcher.onEvent((evt) => events.push(evt));

    // Escribir contenido grande (mayor que el contenido posterior para verificar truncamiento)
    fs.appendFileSync(testLogFile, "Línea inicial grande de contenido previo con suficiente longitud para exceder el nuevo contenido\n", "utf-8");
    watcher.handleFileChange(testLogFile);
    expect(events.length).toBe(1);

    // Truncar archivo a menor tamaño
    const newLine = JSON.stringify({ type: "USER_INPUT", content: "Nuevo inicio tras truncate" }) + "\n";
    fs.writeFileSync(testLogFile, newLine, "utf-8");
    watcher.handleFileChange(testLogFile);

    expect(events.length).toBe(2);
    expect(events[1].content).toContain("Nuevo inicio tras truncate");

    await watcher.stop();
  });
});
