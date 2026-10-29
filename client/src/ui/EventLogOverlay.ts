import type { OfficeEvent } from "@office/shared";

export class EventLogOverlay {
  private container: HTMLElement;
  private listElement: HTMLElement;
  private countBadge: HTMLElement;
  private isVisible = true;
  private maxItems = 60;
  private eventCount = 0;

  constructor() {
    this.container = document.getElementById("event-feed-panel") as HTMLElement;
    this.listElement = document.getElementById("event-feed-list") as HTMLElement;
    this.countBadge = document.getElementById("event-count-badge") as HTMLElement;

    const toggleBtn = document.getElementById("btn-toggle-events");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleVisibility());
    }

    const closeBtn = document.getElementById("btn-close-events");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.setVisibility(false));
    }

    const clearBtn = document.getElementById("btn-clear-events");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clear());
    }
  }

  public addEvent(event: OfficeEvent): void {
    if (!this.listElement) return;

    this.eventCount++;
    if (this.countBadge) {
      this.countBadge.textContent = `${this.eventCount}`;
    }

    const timeStr = event.timestamp
      ? new Date(event.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
      : new Date().toLocaleTimeString();

    // Determinar estilo según agente o estado
    let badgeColor = "#3b82f6";
    if (event.agentId === "backend-developer") badgeColor = "#10b981";
    if (event.agentId === "qa-engineer") badgeColor = "#8b5cf6";

    let stateIcon = "💤";
    if (event.state === "THINKING") stateIcon = "💡";
    if (event.state === "TYPING") stateIcon = "⌨️";
    if (event.state === "WALKING") stateIcon = "🚶";

    const item = document.createElement("div");
    item.className = "event-item animate-fade-in";
    item.style.cssText = `
      padding: 8px 10px;
      margin-bottom: 6px;
      background: rgba(30, 41, 59, 0.85);
      border-left: 3px solid ${badgeColor};
      border-radius: 4px;
      font-size: 11px;
      line-height: 1.4;
      color: #e2e8f0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    `;

    const toolBadge = event.toolName
      ? `<span style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; padding: 1px 4px; border-radius: 3px; font-weight: bold; margin-left: 4px;">🔧 ${event.toolName}</span>`
      : "";

    const contentSnippet = event.content
      ? `<div style="color: #94a3b8; margin-top: 3px; font-style: italic; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">"${event.content}"</div>`
      : "";

    item.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
        <span style="font-weight: bold; color: ${badgeColor};">${event.agentId}</span>
        <span style="color: #64748b; font-size: 10px;">${timeStr}</span>
      </div>
      <div>
        <span>${stateIcon} <strong>${event.state}</strong></span>
        ${toolBadge}
      </div>
      ${contentSnippet}
    `;

    // Insertar al inicio de la lista
    this.listElement.prepend(item);

    // Limitar cantidad máxima de elementos en memoria DOM
    while (this.listElement.children.length > this.maxItems) {
      this.listElement.lastElementChild?.remove();
    }
  }

  public setVisibility(visible: boolean): void {
    this.isVisible = visible;
    if (this.container) {
      this.container.style.display = this.isVisible ? "flex" : "none";
    }
  }

  public toggleVisibility(): void {
    this.setVisibility(!this.isVisible);
  }

  public clear(): void {
    if (this.listElement) {
      this.listElement.innerHTML = "";
    }
    this.eventCount = 0;
    if (this.countBadge) {
      this.countBadge.textContent = "0";
    }
  }
}
