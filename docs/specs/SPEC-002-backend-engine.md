# SPEC-002: Motor de Ingesta, Parsers Multi-Proveedor y WebSocket Server

- **Estado:** COMPLETADO / APROBADO (LGTM)
- **Responsables:**
  - **Orchestrator:** Diseño de SPEC y supervisión.
  - **Developer:** Implementación de parsers, watcher, mock generator y tests.
  - **Reviewer:** Auditoría de cobertura, types y streaming de sockets.

---

## 1. Objetivo
Implementar el daemon de backend (`@office/server`) que carga la configuración de [`office.config.yaml`](../../office.config.yaml), vigila ficheros de logs locales mediante Chokidar, normaliza eventos provenientes de múltiples proveedores (Antigravity/Gemini, Claude Code, OpenCode, JSONL genérico), dispone de un generador mock de eventos de oficina para pruebas autónomas, y transmite el stream de eventos en tiempo real mediante Socket.io a los clientes conectados.

---

## 2. Componentes a Desarrollar

```text
server/
├── src/
│   ├── config/
│   │   └── configLoader.ts       # Carga, validación y hot-reload de office.config.yaml
│   ├── parsers/
│   │   ├── baseParser.ts         # Interfaz abstracta BaseLogParser
│   │   ├── antigravityParser.ts  # Parser de transcript.jsonl
│   │   ├── claudeCodeParser.ts   # Parser de logs de Claude Code CLI
│   │   ├── openCodeParser.ts     # Parser de logs/eventos de OpenCode
│   │   ├── genericJsonlParser.ts # Parser universal para office-events.jsonl
│   │   └── parserRegistry.ts     # Factoría según watch_type o provider
│   ├── watchers/
│   │   └── logWatcher.ts         # Gestor de Chokidar para múltiples rutas
│   ├── simulator/
│   │   └── mockGenerator.ts      # Ciclos autónomos de simulación para pruebas
│   ├── socket/
│   │   └── socketServer.ts       # Gestor de conexiones Socket.io y broadcast
│   └── index.ts                  # Entry point con endpoints REST y Socket.io
└── tests/
    ├── configLoader.test.ts      # Tests unitarios de carga de config
    ├── parsers.test.ts           # Tests de normalización multi-proveedor
    └── mockGenerator.test.ts     # Tests de generación de eventos mock
```

---

## 3. Contratos de Parsers y Adaptadores

```typescript
export interface LogParser {
  readonly id: string;
  readonly supportedWatchTypes: string[];
  parseLine(rawLine: string, agentId: string, metadata?: Record<string, unknown>): OfficeEvent | null;
}
```

### Parsers Soportados:
1. **`AntigravityParser`:** Parsea líneas de `transcript.jsonl` detectando `step_index`, `type` (`USER_INPUT`, `PLANNER_RESPONSE`), `source` y llamadas a subagentes (`send_message`, `invoke_subagent`).
2. **`ClaudeCodeParser`:** Parsea entradas de log de Claude Code mapeando tool invocations y reasoning a `THINKING` y `TYPING`.
3. **`OpenCodeParser`:** Parsea streams y eventos emitidos por OpenCode mapeando estados de tareas y mensajes a agentes.
4. **`GenericJsonlParser`:** Formato directo JSONL `{ timestamp, agentId, type, state, targetAgentId, content }` para cualquier script o modelo local (Ollama, custom Python/Node).

---

## 4. Generador de Eventos Mock (`MockGenerator`)
Para que el usuario pueda probar el producto inmediatamente sin tener que ejecutar agentes en vivo:
- Permite iniciar el servidor en modo `--mock` o activar la simulación vía API/WebSocket.
- Genera un ciclo narrativo de oficina natural:
  1. `architect` pasa a `THINKING` ("Analizando requerimientos de arquitectura...").
  2. `architect` pasa a `TYPING` ("Escribiendo especificación técnica...").
  3. `architect` pasa a `WALKING` hacia `backend-developer` con `MESSAGE_SENT` ("Revisa la API de sincronización").
  4. Ambos agentes entran en `COLLABORATING`.
  5. `backend-developer` pasa a `TYPING` ("Implementando endpoints en TypeScript...").
  6. `qa-engineer` o `opencode` recibe el entregable y pasa a `TYPING` ("Ejecutando pruebas de integración...").
  7. Retorno a `IDLE`.

---

## 5. Criterios de Aceptación (Checklist de Reviewer)

- [ ] **AC-1 (Config Loader):** Carga y valida correctamente `office.config.yaml` desde la raíz, devolviendo un objeto tipado `OfficeConfig`.
- [ ] **AC-2 (Parsers Multi-Proveedor):** Implementación de al menos 4 parsers (`AntigravityParser`, `ClaudeCodeParser`, `OpenCodeParser`, `GenericJsonlParser`) que transforman cadenas raw en `OfficeEvent`.
- [ ] **AC-3 (Watcher Chokidar):** Observa incrementalmente los ficheros especificados en `watch_target` sin recargar el archivo completo y emite eventos en tiempo real.
- [ ] **AC-4 (Mock Generator):** Capacidad de emitir ráfagas de eventos realistas con temporizador configurable para pruebas fuera de línea.
- [ ] **AC-5 (Socket.io & REST):** Servidor expone eventos `office:event`, `office:config`, endpoints `/health`, `/api/config` y `/api/simulate`.
- [ ] **AC-6 (Testing & Calidad):** Pruebas unitarias con Vitest pasando al 100%. Cero firmas `Co-authored-by`.
