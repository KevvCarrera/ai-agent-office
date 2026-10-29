import Phaser from "phaser";
import { socketClient } from "../network/socketClient.js";
import { EventLogOverlay } from "../ui/EventLogOverlay.js";
import { AgentInspector, type AgentInspectData } from "../ui/AgentInspector.js";
import type { OfficeScene } from "./OfficeScene.js";

export class UIScene extends Phaser.Scene {
  private eventLogOverlay!: EventLogOverlay;
  private agentInspector!: AgentInspector;

  constructor() {
    super({ key: "UIScene" });
  }

  create(): void {
    this.eventLogOverlay = new EventLogOverlay();
    this.agentInspector = new AgentInspector();

    this.setupHUDControls();
    this.setupNetworkBridge();
    this.setupOfficeSceneBridge();
  }

  /**
   * Configura los botones y estado de la barra superior HUD
   */
  private setupHUDControls(): void {
    const statusPill = document.getElementById("status-pill");
    const modeBadge = document.getElementById("mode-badge");
    const toggleSimBtn = document.getElementById("btn-toggle-sim");
    const stepSimBtn = document.getElementById("btn-step-sim");
    const centerCamBtn = document.getElementById("btn-center-cam");

    // 1. Estado de conexión WebSocket
    const updateConnectionUI = (connected: boolean) => {
      if (!statusPill) return;
      if (connected) {
        statusPill.innerHTML = `🟢 <span style="color:#4ade80;font-weight:bold;">En línea</span> <small style="color:#94a3b8;">(Puerto 4000)</small>`;
        statusPill.style.borderColor = "#22c55e";
      } else {
        statusPill.innerHTML = `🔴 <span style="color:#f87171;font-weight:bold;">Desconectado</span>`;
        statusPill.style.borderColor = "#ef4444";
      }
    };

    socketClient.onConnect(() => updateConnectionUI(true));
    socketClient.onDisconnect(() => updateConnectionUI(false));
    updateConnectionUI(socketClient.isConnected());

    // 2. Estado de simulación mock
    const updateSimulationUI = (running: boolean) => {
      if (modeBadge) {
        if (running) {
          modeBadge.innerHTML = `🎭 <span style="color:#38bdf8;font-weight:bold;">Simulación Mock Activa</span>`;
          modeBadge.style.borderColor = "#0284c7";
        } else {
          modeBadge.innerHTML = `📁 <span style="color:#fbbf24;font-weight:bold;">Observador de Logs</span>`;
          modeBadge.style.borderColor = "#d97706";
        }
      }

      if (toggleSimBtn) {
        toggleSimBtn.innerHTML = running ? `⏸ Pausar Simulación` : `▶ Reanudar Simulación`;
        toggleSimBtn.style.backgroundColor = running ? "#475569" : "#2563eb";
      }
    };

    socketClient.onSimulationStatus((status) => {
      updateSimulationUI(status.running);
    });
    updateSimulationUI(socketClient.isSimulationRunning());

    // 3. Botón de alternar simulación
    if (toggleSimBtn) {
      toggleSimBtn.addEventListener("click", async () => {
        toggleSimBtn.setAttribute("disabled", "true");
        await socketClient.toggleSimulation();
        toggleSimBtn.removeAttribute("disabled");
      });
    }

    // 4. Botón de paso manual
    if (stepSimBtn) {
      stepSimBtn.addEventListener("click", async () => {
        stepSimBtn.setAttribute("disabled", "true");
        await socketClient.stepSimulation();
        stepSimBtn.removeAttribute("disabled");
      });
    }

    // 5. Botón de centrar cámara
    if (centerCamBtn) {
      centerCamBtn.addEventListener("click", () => {
        const officeScene = this.scene.get("OfficeScene") as OfficeScene;
        if (officeScene && typeof officeScene.centerCamera === "function") {
          officeScene.centerCamera();
        }
      });
    }
  }

  /**
   * Conecta los eventos del servidor con el panel de log en vivo
   */
  private setupNetworkBridge(): void {
    socketClient.onEvent((event) => {
      this.eventLogOverlay.addEvent(event);
    });
  }

  /**
   * Conecta los clics de los sprites en OfficeScene con el inspector modal
   */
  private setupOfficeSceneBridge(): void {
    const officeScene = this.scene.get("OfficeScene");
    if (officeScene) {
      officeScene.events.on("agent:selected", (data: AgentInspectData) => {
        this.agentInspector.show(data);
      });
    }
  }
}
