import type { AgentMetadata, AgentState, OfficeEvent } from "@office/shared";

export interface AgentInspectData {
  metadata: AgentMetadata;
  currentState: AgentState;
  lastEvent?: OfficeEvent;
}

export class AgentInspector {
  private modalElement: HTMLElement;
  private nameElement: HTMLElement;
  private modelElement: HTMLElement;
  private stateElement: HTMLElement;
  private watchTargetElement: HTMLElement;
  private lastMessageElement: HTMLElement;
  private avatarBadge: HTMLElement;
  private cardElement: HTMLElement;

  constructor() {
    this.modalElement = document.getElementById("agent-inspector-modal") as HTMLElement;
    this.cardElement = document.querySelector(".inspector-card") as HTMLElement;
    this.nameElement = document.getElementById("inspector-name") as HTMLElement;
    this.modelElement = document.getElementById("inspector-model") as HTMLElement;
    this.stateElement = document.getElementById("inspector-state") as HTMLElement;
    this.watchTargetElement = document.getElementById("inspector-watch-target") as HTMLElement;
    this.lastMessageElement = document.getElementById("inspector-last-message") as HTMLElement;
    this.avatarBadge = document.getElementById("inspector-avatar-badge") as HTMLElement;

    const closeBtn = document.getElementById("btn-close-inspector");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.hide());
    }

    if (this.modalElement) {
      this.modalElement.addEventListener("click", (e) => {
        if (e.target === this.modalElement) {
          this.hide();
        }
      });
    }
  }

  private getProviderColor(metadata: AgentMetadata): { color: string; bg: string; glow: string } {
    const p = (metadata.provider || "").toLowerCase();
    const id = metadata.id.toLowerCase();
    const model = (metadata.model || "").toLowerCase();

    if (p.includes("claude") || id.includes("arch") || model.includes("claude")) {
      return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", glow: "rgba(245, 158, 11, 0.4)" };
    }
    if (p.includes("gemini") || id.includes("back") || model.includes("gemini")) {
      return { color: "#06b6d4", bg: "rgba(6, 182, 212, 0.15)", glow: "rgba(6, 182, 212, 0.4)" };
    }
    if (p.includes("opencode") || id.includes("qa") || model.includes("open")) {
      return { color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", glow: "rgba(16, 185, 129, 0.4)" };
    }
    return { color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", glow: "rgba(56, 189, 248, 0.4)" };
  }

  public show(data: AgentInspectData): void {
    if (!this.modalElement) return;

    const { color, bg, glow } = this.getProviderColor(data.metadata);

    if (this.nameElement) {
      this.nameElement.textContent = data.metadata.name;
    }

    if (this.modelElement) {
      this.modelElement.textContent = data.metadata.model;
      this.modelElement.style.color = color;
    }

    if (this.watchTargetElement) {
      this.watchTargetElement.textContent = data.metadata.watch_target || "N/A";
    }

    if (this.cardElement) {
      this.cardElement.style.borderColor = color;
      this.cardElement.style.boxShadow = `0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px ${glow}`;
    }

    // Avatar
    if (this.avatarBadge) {
      this.avatarBadge.style.backgroundColor = color;
      this.avatarBadge.style.boxShadow = `0 0 12px ${glow}`;
      this.avatarBadge.textContent = data.metadata.name.charAt(0);
    }

    // Estado actual
    if (this.stateElement) {
      let stateColor = "#94a3b8";
      let icon = "💤";
      if (data.currentState === "THINKING") {
        stateColor = "#facc15";
        icon = "💡";
      } else if (data.currentState === "TYPING") {
        stateColor = "#38bdf8";
        icon = "⌨️";
      } else if (data.currentState === "WALKING") {
        stateColor = "#4ade80";
        icon = "🚶";
      }

      this.stateElement.innerHTML = `
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background-color: ${stateColor}; margin-right: 6px; box-shadow: 0 0 6px ${stateColor};"></span>
        <strong style="color: ${stateColor};">${icon} ${data.currentState}</strong>
      `;
    }

    // Último mensaje o evento
    if (this.lastMessageElement) {
      this.lastMessageElement.style.borderLeftColor = color;
      this.lastMessageElement.style.background = bg;
      if (data.lastEvent) {
        const time = data.lastEvent.timestamp
          ? new Date(data.lastEvent.timestamp).toLocaleTimeString()
          : "Reciente";
        const tool = data.lastEvent.toolName ? ` [Herramienta: ${data.lastEvent.toolName}]` : "";
        const content = data.lastEvent.content ? `\n"${data.lastEvent.content}"` : "";
        this.lastMessageElement.textContent = `${time} - Evento: ${data.lastEvent.type}${tool}${content}`;
      } else {
        this.lastMessageElement.textContent = "Sin actividad reciente registrada.";
      }
    }

    this.modalElement.style.display = "flex";
  }

  public hide(): void {
    if (this.modalElement) {
      this.modalElement.style.display = "none";
    }
  }
}
