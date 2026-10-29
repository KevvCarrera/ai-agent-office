import Phaser from "phaser";
import type { AgentMetadata, AgentState, OfficeEvent } from "@office/shared";
import type { Desk } from "./Desk.js";
import { SpeechBubble } from "./SpeechBubble.js";

export class AgentSprite extends Phaser.GameObjects.Container {
  public agentId: string;
  public metadata: AgentMetadata;
  public homeDesk: Desk;
  public currentState: AgentState = "IDLE";
  public lastEvent?: OfficeEvent;

  private characterSprite: Phaser.GameObjects.Sprite;
  private shadowSprite: Phaser.GameObjects.Sprite;
  private nameLabel: Phaser.GameObjects.Text;
  private modelBadge: Phaser.GameObjects.Text;
  private stateIcon: Phaser.GameObjects.Sprite;
  private toolBadge: Phaser.GameObjects.Container;
  private toolText: Phaser.GameObjects.Text;
  private toolBg: Phaser.GameObjects.Graphics;

  private homePos: { x: number; y: number };
  private walkTween?: Phaser.Tweens.Tween;
  private typingTimer?: Phaser.Time.TimerEvent;
  private currentBubble?: SpeechBubble;
  private isReturningHome = false;

  constructor(scene: Phaser.Scene, metadata: AgentMetadata, desk: Desk) {
    const seatPos = desk.getSeatPosition();
    super(scene, seatPos.x, seatPos.y);

    this.agentId = metadata.id;
    this.metadata = metadata;
    this.homeDesk = desk;
    this.homePos = { x: seatPos.x, y: seatPos.y };

    const spriteKey = this.metadata.sprite || "avatar_blue";

    // 1. Sombra bajo los pies
    this.shadowSprite = scene.add.sprite(0, 20, "agent_shadow");
    this.shadowSprite.setOrigin(0.5, 0.5);

    // 2. Sprite principal del personaje
    this.characterSprite = scene.add.sprite(0, 0, `${spriteKey}_sit`);
    this.characterSprite.setOrigin(0.5, 0.5);

    // 3. Etiqueta de Nombre del Agente
    this.nameLabel = scene.add.text(0, 24, metadata.name, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "10px",
      fontStyle: "bold",
      color: "#f8fafc",
      stroke: "#0f172a",
      strokeThickness: 3
    });
    this.nameLabel.setOrigin(0.5, 0);

    // 4. Etiqueta de Modelo de IA
    const shortModel = metadata.model.split(" ")[0] || "AI";
    this.modelBadge = scene.add.text(0, 36, shortModel, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "9px",
      color: "#94a3b8",
      backgroundColor: "#0f172a",
      padding: { x: 3, y: 1 }
    });
    this.modelBadge.setOrigin(0.5, 0);

    // 5. Icono de Estado Flotante (THINKING / ACCIONES)
    this.stateIcon = scene.add.sprite(0, -32, "icon_bulb");
    this.stateIcon.setOrigin(0.5, 0.5);
    this.stateIcon.setVisible(false);

    // 6. Badge flotante para llamadas a herramientas (TOOL_CALLED)
    this.toolBadge = scene.add.container(0, -42);
    this.toolBg = scene.add.graphics();
    this.toolText = scene.add.text(0, 0, "", {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "9px",
      fontStyle: "bold",
      color: "#38bdf8"
    });
    this.toolText.setOrigin(0.5, 0.5);
    this.toolBadge.add([this.toolBg, this.toolText]);
    this.toolBadge.setVisible(false);

    // Agregar todos los elementos al contenedor
    this.add([
      this.shadowSprite,
      this.characterSprite,
      this.nameLabel,
      this.modelBadge,
      this.stateIcon,
      this.toolBadge
    ]);

    this.setDepth(this.y + 20);

    // Interactividad al hacer clic
    this.setSize(36, 54);
    this.setInteractive({ cursor: "pointer" });

    this.on("pointerdown", () => {
      this.scene.events.emit("agent:selected", {
        metadata: this.metadata,
        currentState: this.currentState,
        lastEvent: this.lastEvent
      });
      this.pulseSelection();
    });

    this.on("pointerover", () => {
      this.characterSprite.setTint(0x93c5fd);
    });

    this.on("pointerout", () => {
      this.characterSprite.clearTint();
    });

    scene.add.existing(this);
    this.applyIdleState();
  }

  /**
   * Resalta al agente al ser seleccionado
   */
  private pulseSelection(): void {
    this.scene.tweens.add({
      targets: this,
      scale: 1.15,
      yoyo: true,
      duration: 120,
      ease: "Power2"
    });
  }

  /**
   * Actualiza el estado visual del agente según los eventos del servidor
   */
  public handleEvent(event: OfficeEvent, allAgents: Map<string, AgentSprite>): void {
    this.lastEvent = event;
    this.currentState = event.state;

    // Si hay un targetAgentId y es un mensaje o colaboración, desplazarse al destino
    if (event.targetAgentId && event.targetAgentId !== this.agentId && event.type === "MESSAGE_SENT") {
      const targetAgent = allAgents.get(event.targetAgentId);
      if (targetAgent) {
        this.walkToTargetAndCollaborate(targetAgent, event);
        return;
      }
    }

    switch (event.state) {
      case "IDLE":
        if (!this.isReturningHome && this.walkTween?.isPlaying()) {
          // No interrumpir si está regresando
        } else {
          this.applyIdleState();
        }
        break;

      case "THINKING":
        this.applyThinkingState();
        break;

      case "TYPING":
        this.applyTypingState(event.toolName);
        break;

      case "WALKING":
        // Manejado por desplazamiento
        break;

      default:
        this.applyIdleState();
        break;
    }
  }

  /**
   * Estado IDLE: Sentado en su escritorio en reposo
   */
  private applyIdleState(): void {
    this.clearStateEffects();
    const spriteKey = this.metadata.sprite || "avatar_blue";
    this.characterSprite.setTexture(`${spriteKey}_sit`);
    this.homeDesk.setWorking(false);

    // Animación sutil de respiración
    this.scene.tweens.add({
      targets: this.characterSprite,
      scaleY: { from: 1, to: 0.96 },
      duration: 1400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  /**
   * Estado THINKING: Icono de bombilla flotante + monitor activo
   */
  private applyThinkingState(): void {
    this.clearStateEffects();
    const spriteKey = this.metadata.sprite || "avatar_blue";
    this.characterSprite.setTexture(`${spriteKey}_sit`);
    this.homeDesk.setWorking(true);

    this.stateIcon.setTexture("icon_bulb");
    this.stateIcon.setVisible(true);

    // Animación flotante de bombilla
    this.scene.tweens.add({
      targets: this.stateIcon,
      y: { from: -32, to: -38 },
      scale: { from: 1, to: 1.15 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  /**
   * Estado TYPING / TOOL_CALLED: Animación rápida de tecleo y badge de herramienta
   */
  private applyTypingState(toolName?: string): void {
    this.clearStateEffects();
    const spriteKey = this.metadata.sprite || "avatar_blue";
    this.homeDesk.setWorking(true);

    let frame = 0;
    this.typingTimer = this.scene.time.addEvent({
      delay: 150,
      loop: true,
      callback: () => {
        frame = frame === 0 ? 1 : 0;
        this.characterSprite.setTexture(`${spriteKey}_typing_${frame}`);
      }
    });

    if (toolName) {
      this.showToolBadge(toolName);
    }
  }

  private showToolBadge(toolName: string): void {
    const text = `🔧 ${toolName}`;
    this.toolText.setText(text);

    const padding = 6;
    const width = this.toolText.width + padding * 2;
    const height = 16;

    this.toolBg.clear();
    this.toolBg.fillStyle(0x0f172a, 0.9);
    this.toolBg.fillRoundedRect(-width / 2, -height / 2, width, height, 4);
    this.toolBg.lineStyle(1, 0x38bdf8, 1);
    this.toolBg.strokeRoundedRect(-width / 2, -height / 2, width, height, 4);

    this.toolBadge.setVisible(true);

    this.scene.tweens.add({
      targets: this.toolBadge,
      y: { from: -42, to: -46 },
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }

  /**
   * Desplazamiento animado (walking) hacia otro escritorio para colaborar
   */
  public walkToTargetAndCollaborate(targetAgent: AgentSprite, event: OfficeEvent): void {
    this.clearStateEffects();
    this.isReturningHome = false;

    const targetPos = targetAgent.homeDesk.getVisitorPosition();
    const spriteKey = this.metadata.sprite || "avatar_blue";

    const dx = targetPos.x - this.x;
    const dy = targetPos.y - this.y;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, targetPos.x, targetPos.y);
    const duration = Math.max(800, (distance / 120) * 1000);

    // Animación de pasos durante el tween
    let walkFrame = 0;
    const walkTimer = this.scene.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        walkFrame = walkFrame === 0 ? 1 : 0;
        if (Math.abs(dx) > Math.abs(dy)) {
          const dir = dx > 0 ? "right" : "left";
          this.characterSprite.setTexture(`${spriteKey}_walk_${dir}_${walkFrame}`);
        } else {
          const dir = dy > 0 ? "down" : "down";
          this.characterSprite.setTexture(`${spriteKey}_walk_${dir}_${walkFrame}`);
        }
      }
    });

    this.walkTween = this.scene.tweens.add({
      targets: this,
      x: targetPos.x,
      y: targetPos.y,
      duration,
      ease: "Linear",
      onUpdate: () => {
        this.setDepth(this.y + 20);
      },
      onComplete: () => {
        walkTimer.remove();
        this.characterSprite.setTexture(`${spriteKey}_stand_down`);

        // Abrir diálogo de colaboración
        this.showCollaborationBubble(targetAgent, event, () => {
          this.walkBackHome();
        });
      }
    });
  }

  /**
   * Muestra el SpeechBubble y gestiona la interacción
   */
  private showCollaborationBubble(
    targetAgent: AgentSprite,
    event: OfficeEvent,
    onFinish: () => void
  ): void {
    if (this.currentBubble) {
      this.currentBubble.destroy();
    }

    const message =
      event.content ||
      (event.toolName ? `Ejecutando herramienta: ${event.toolName}` : "Sincronizando estado de tareas...");

    this.currentBubble = new SpeechBubble(this.scene, this.x, this.y - 20, {
      speakerName: this.metadata.name,
      targetName: targetAgent.metadata.name,
      message,
      durationMs: 4000,
      onComplete: () => {
        this.currentBubble = undefined;
        onFinish();
      }
    });
  }

  /**
   * Retorno caminando a su propio escritorio
   */
  public walkBackHome(): void {
    this.isReturningHome = true;
    const spriteKey = this.metadata.sprite || "avatar_blue";

    const dx = this.homePos.x - this.x;
    const dy = this.homePos.y - this.y;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, this.homePos.x, this.homePos.y);
    const duration = Math.max(800, (distance / 120) * 1000);

    let walkFrame = 0;
    const walkTimer = this.scene.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        walkFrame = walkFrame === 0 ? 1 : 0;
        if (Math.abs(dx) > Math.abs(dy)) {
          const dir = dx > 0 ? "right" : "left";
          this.characterSprite.setTexture(`${spriteKey}_walk_${dir}_${walkFrame}`);
        } else {
          const dir = dy < 0 ? "up" : "down";
          this.characterSprite.setTexture(dir === "up" ? `${spriteKey}_stand_up` : `${spriteKey}_walk_down_${walkFrame}`);
        }
      }
    });

    this.walkTween = this.scene.tweens.add({
      targets: this,
      x: this.homePos.x,
      y: this.homePos.y,
      duration,
      ease: "Linear",
      onUpdate: () => {
        this.setDepth(this.y + 20);
      },
      onComplete: () => {
        walkTimer.remove();
        this.isReturningHome = false;
        this.applyIdleState();
      }
    });
  }

  private clearStateEffects(): void {
    this.scene.tweens.killTweensOf(this.characterSprite);
    this.scene.tweens.killTweensOf(this.stateIcon);
    this.scene.tweens.killTweensOf(this.toolBadge);

    this.characterSprite.setScale(1);
    this.stateIcon.setVisible(false);
    this.toolBadge.setVisible(false);

    if (this.typingTimer) {
      this.typingTimer.remove();
      this.typingTimer = undefined;
    }
  }

  public destroy(fromScene?: boolean): void {
    this.clearStateEffects();
    if (this.walkTween) {
      this.walkTween.stop();
    }
    if (this.currentBubble) {
      this.currentBubble.destroy();
    }
    super.destroy(fromScene);
  }
}
