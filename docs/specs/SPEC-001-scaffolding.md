# SPEC-001: Scaffolding del Monorepo, Entorno Base y Tipos Compartidos

- **Estado:** PENDIENTE DE IMPLEMENTACIÓN
- **Responsables:** 
  - **Orchestrator:** Diseño de SPEC y supervisión.
  - **Developer:** Implementación de paquetes, configs y tipados.
  - **Reviewer:** Auditoría de compilación, linter y workspaces.

---

## 1. Objetivo
Inicializar la estructura técnica del proyecto como un monorepo ligero con npm workspaces que soporte el cliente web (Vite + Phaser.js 3 + TypeScript) y el servidor daemon (Node.js + TypeScript + Socket.io), compartiendo las interfaces y tipos de datos del dominio sin duplicación.

---

## 2. Alcance Técnico y Arquitectura de Carpetas

```text
ai-agent-office/
├── package.json               # Configuración de workspaces: ["packages/*", "client", "server"]
├── tsconfig.base.json         # Configuración TypeScript base compartida
├── office.config.yaml         # Configuración del dominio
├── AGENTS.md                  # Reglas del equipo multiagente
├── docs/specs/                # Especificaciones SDD
│   ├── PLAN-SDD.md
│   └── SPEC-001-scaffolding.md
├── shared/                    # Tipos y contratos universales (@office/shared)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── events.ts          # OfficeEvent, EventType, AgentState
│       ├── config.ts          # OfficeConfig, RoomConfig, AgentConfig
│       └── index.ts
├── server/                    # Backend Daemon (@office/server)
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── index.ts           # Entry point inicial verificable
└── client/                    # Frontend 2D Visualizer (@office/client)
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── index.html
    └── src/
        └── main.ts            # Entry point inicial con canvas Phaser montable
```

---

## 3. Contratos de Datos Compartidos (`shared/src/events.ts` & `config.ts`)

### `AgentState` & `OfficeEvent`
```typescript
export type AgentState = "IDLE" | "THINKING" | "TYPING" | "WALKING" | "MESSAGING" | "ERROR";

export type EventType = "STATE_CHANGE" | "MESSAGE_SENT" | "TOOL_CALLED" | "COLLABORATION_START" | "COLLABORATION_END";

export interface OfficeEvent {
  id: string;
  timestamp: string;
  agentId: string;
  type: EventType;
  state: AgentState;
  targetAgentId?: string;
  content?: string;
  toolName?: string;
  metadata?: Record<string, unknown>;
}
```

### `OfficeConfig`
```typescript
export interface DeskCoords {
  x: number;
  y: number;
}

export interface OfficeRoom {
  id: string;
  name: string;
  desk_coords: DeskCoords;
  assigned_agent: string;
}

export interface AgentMetadata {
  id: string;
  name: string;
  model: string;
  sprite: string;
  watch_target: string;
}

export interface OfficeConfig {
  version: string;
  settings: {
    refresh_rate_ms: number;
    websocket_port: number;
    http_port: number;
  };
  offices: OfficeRoom[];
  agents: AgentMetadata[];
}
```

---

## 4. Criterios de Aceptación (Checklist de Reviewer)

- [ ] **AC-1 (Workspaces):** El archivo `package.json` raíz define los workspaces (`["shared", "server", "client"]`) y permite instalar dependencias con `npm install`.
- [ ] **AC-2 (Shared Types):** El paquete `shared` compila con `npm run build` en su directorio y exporta correctamente tipos utilizables tanto por `server` como por `client`.
- [ ] **AC-3 (Server Bootstrap):** El paquete `server` compila con `tsc` sin errores en modo estricto y tiene un script `npm run dev` / `npm run build`.
- [ ] **AC-4 (Client Bootstrap):** El paquete `client` tiene Phaser 3 y Vite configurados; compila sin errores de tipos y `npm run build` genera la distribución web exitosamente.
- [ ] **AC-5 (Scripts Raíz):** Desde la raíz del repositorio se puede ejecutar:
  - `npm run build` (compila shared, server y client).
  - `npm run check:types` o lint para verificación global de tipos.
- [ ] **AC-6 (Git & Calidad):** No contiene referencias de `Co-authored-by`. Todo el código está debidamente tipado en TypeScript.
