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

  constructor() {
    this.modalElement = document.getElementById("agent-inspector-modal") as HTMLElement;
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

  public show(data: AgentInspectData): void {
    if (!this.modalElement) return;

    if (this.nameElement) {
      this.nameElement.textContent = data.metadata.name;
    }

    if (this.modelElement) {
      this.modelElement.textContent = data.metadata.model;
    }

    if (this.watchTargetElement) {
      this.watchTargetElement.textContent = data.metadata.watch_target || "N/A";
    }

    // Avatar color
    if (this.avatarBadge) {
      let bgColor = "#2563eb";
      if (data.metadata.id === "backend-developer") bgColor = "#059669";
      if (data.metadata.id === "qa-engineer") bgColor = "#7c3aed";
      this.avatarBadge.style.backgroundColor = bgColor;
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
