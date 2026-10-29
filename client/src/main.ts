import Phaser from "phaser";
import type { AgentState, OfficeEvent } from "@office/shared";

export class OfficeBootScene extends Phaser.Scene {
  constructor() {
    super({ key: "OfficeBootScene" });
  }

  preload(): void {
    // Espacio reservado para precarga de sprites y tilesets en Hito 3
  }

  create(): void {
    const { width, height } = this.scale;

    const initialEvent: OfficeEvent = {
      id: "evt-boot-1",
      timestamp: new Date().toISOString(),
      agentId: "architect",
      type: "STATE_CHANGE",
      state: "IDLE" as AgentState,
      provider: "Claude (Claude Code)",
      watch_type: "claude_code",
      content: "AI Agent Office visualizer initialized."
    };

    const title = this.add
      .text(width / 2, height / 2 - 40, "AI Agent Office", {
        fontSize: "32px",
        color: "#38bdf8",
        fontStyle: "bold"
      })
      .setOrigin(0.5);

    const statusText = this.add
      .text(
        width / 2,
        height / 2 + 10,
        `Estado: ${initialEvent.state} | Watcher: ${initialEvent.watch_type} (${initialEvent.provider})`,
        {
          fontSize: "16px",
          color: "#e2e8f0"
        }
      )
      .setOrigin(0.5);

    const readyText = this.add
      .text(width / 2, height / 2 + 55, "Phaser.js 3 montado exitosamente", {
        fontSize: "14px",
        color: "#4ade80"
      })
      .setOrigin(0.5);

    this.tweens.add({
      targets: [title, statusText, readyText],
      alpha: { from: 0.2, to: 1 },
      duration: 600,
      ease: "Power2"
    });
  }
}

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 800,
  height: 600,
  backgroundColor: "#0f172a",
  scene: [OfficeBootScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  }
};

export const game = new Phaser.Game(gameConfig);
