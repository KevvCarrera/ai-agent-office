# 🏢 AI Agent Office

A lightweight, real-time 2D pixel-art visualizer that turns your multi-agent AI workflows into an animated virtual office. Watch your agents think, type at their desks, and walk over to collaborate with other agents.

---

## 🎯 Overview

Modern AI development often involves multiple agents communicating in parallel or sequentially (architects, developers, reviewers, QAs). Following terminal logs or raw JSON transcripts can be tedious and disconnected.

**AI Agent Office** acts as a visual, interactive observation deck:
- Each agent gets a designated room, office, or desk.
- Real-time visual status cues: **Thinking**, **Working / Typing**, **Idle**, or **Collaborating**.
- Speech bubbles and message flows when agents hand off tasks or communicate.
- Completely vendor-agnostic: Works with Claude (via Claude Code), Gemini, OpenAI, or local models.
- **Zero API Overhead:** Reads local transcripts, files, or event streams—no per-token API cost for visualization.

---

## 🏗️ Architecture

```mermaid
flowchart TD
    subgraph Agents ["AI Agent Runtimes"]
        A1["Antigravity / Gemini CLI<br/>(transcript.jsonl)"]
        A2["Claude Code CLI<br/>(transcript / log stream)"]
        A3["Local Custom Agents / Ollama<br/>(office-events.jsonl)"]
    end

    subgraph Backend ["Daemon (Node.js / Express / Socket.io)"]
        FW["Log / File Watcher (Chokidar)"]
        CFG["office.config.yaml (Room & Agent Registry)"]
        WS["WebSocket Server"]
        
        A1 --> FW
        A2 --> FW
        A3 --> FW
        CFG --> FW
        FW --> WS
    end

    subgraph Frontend ["Pixel-Art Visualizer (Phaser.js 3 / Vite)"]
        MAP["Office Map (2D Tileset / Modern Interiors)"]
        AVATARS["Animated Character Sprites"]
        BUBBLES["Speech & Handoff Bubbles"]
        
        WS -->|Real-Time State Events| MAP
        MAP --> AVATARS
        MAP --> BUBBLES
    end
```

---

## ✨ Features

- **🎮 2D Pixel-Art Virtual Office:** Built with Phaser.js 3 and TypeScript, rendering top-down offices with modular rooms, desks, meeting areas, and animated sprites.
- **💰 Zero API Cost (Passive Observer Pattern):** Hooks into your local developer environment by monitoring log files or event pipes without making external API requests.
- **🔄 Multi-Model & Multi-Vendor:** Supports agents powered by Anthropic (Claude 3.7 Sonnet / Opus / Haiku via Claude Code), Google (Gemini 2.5 Flash / Pro via Antigravity), OpenCode, OpenAI, or local models (Ollama).
- **⚙️ Declarative Office Configuration (`office.config.yaml`):** Configure rooms, desk coordinates, agent metadata, avatars, and file-watching paths without modifying code.
- **⚡ Real-Time Streaming:** Low-latency event streaming via WebSockets.

---

## ⚙️ Configuration Example (`office.config.yaml`)

```yaml
offices:
  - id: "architecture_room"
    name: "Architecture Studio"
    desk_coords: { x: 4, y: 3 }
    assigned_agent: "architect"
  - id: "dev_lab"
    name: "Engineering Lab"
    desk_coords: { x: 10, y: 3 }
    assigned_agent: "backend-developer"
  - id: "qa_office"
    name: "QA & Verification Desk"
    desk_coords: { x: 7, y: 8 }
    assigned_agent: "qa-engineer"

agents:
  - id: "architect"
    name: "Lead Architect"
    model: "Claude 3.7 Sonnet (Claude Code)"
    sprite: "avatar_blue"
    watch_target: "logs/architect.jsonl"
  - id: "backend-developer"
    name: "Backend Developer"
    model: "Gemini 2.5 Flash"
    sprite: "avatar_green"
    watch_target: "logs/backend.jsonl"
  - id: "qa-engineer"
    name: "QA Specialist"
    model: "Claude 3.5 Haiku"
    sprite: "avatar_purple"
    watch_target: "logs/qa.jsonl"
```

---

## 🛠️ Tech Stack

- **Visualizer (Client):** [Phaser.js 3](https://phaser.io/), TypeScript, Vite, TailwindCSS
- **Event Daemon (Server):** Node.js, [Chokidar](https://github.com/paulmillr/chokidar), Socket.io
- **Assets:** 16x16 / 32x32 Top-Down Pixel Art Tilesets (Modern Interiors / RPG City)

---

## 🚀 Getting Started (Guía de Ejecución Rápida)

### 1. Requisitos Previos
* Node.js v18+ (recomendado v20 o v24).
* npm v9+.

### 2. Instalación
```bash
# Clonar el repositorio
git clone https://github.com/KevvCarrera/ai-agent-office.git
cd ai-agent-office

# Instalar dependencias en todo el monorepo
npm install
```

### 3. Iniciar la Oficina Virtual (Servidor + Cliente)
Con un solo comando arrancarás el daemon backend (puerto 4000) y el visualizador Phaser 3 (puerto 3000):

```bash
npm run dev
```

* **Visualizador Web:** Abre tu navegador en [http://localhost:3000](http://localhost:3000)
* **API y Healthcheck:** [http://localhost:4000/health](http://localhost:4000/health)

> [!TIP]
> Por defecto, el servidor se inicia con el **Generador Mock Autónomo** activo si no encuentra ficheros de logs físicos. Verás inmediatamente a los agentes interactuar, pensar con bombillas, teclear código en sus puestos y levantarse para colaborar con bocadillos de diálogo.

### 4. Controles del Visualizador
* **Arrastrar (Click + Drag):** Paneo del plano de la oficina.
* **Rueda del Ratón (Scroll):** Zoom interactivo (0.55x a 2.2x).
* **Click sobre un Agente:** Abre el modal de **Inspección de Agente** con su modelo de IA, estado actual y último mensaje.
* **Barra Superior (HUD):**
  * `Pausar / Reanudar Simulación`: Alterna la generación automática de eventos.
  * `Siguiente Paso`: Dispara un paso individual del libreto narrativo.
  * `Centrar Vista`: Devuelve la cámara al centro de la oficina.
  * `Feed de Eventos`: Despliega el historial en tiempo real de eventos recibidos por WebSocket.

### 5. Ejecutar Pruebas Automatizadas
```bash
# Ejecutar los 35 tests unitarios (server + client)
npm test

# Verificación de tipos TypeScript estricto
npm run check:types

# Compilación de producción
npm run build
```

---

## 📄 License

MIT © [KevvCarrera](https://github.com/KevvCarrera)
