import Phaser from "phaser";

export interface SpeechBubbleOptions {
  speakerName: string;
  targetName?: string;
  message: string;
  durationMs?: number;
  onComplete?: () => void;
  accentColor?: string;
}

export class SpeechBubble extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private headerText: Phaser.GameObjects.Text;
  private messageText: Phaser.GameObjects.Text;
  private tailSprite: Phaser.GameObjects.Sprite;
  private dismissTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, options: SpeechBubbleOptions) {
    super(scene, x, y);

    const maxWidth = 240;
    const padding = 10;
    const accentColor = options.accentColor || "#38bdf8";

    // 1. Título / Header
    const title = options.targetName
      ? `${options.speakerName} ➔ ${options.targetName}`
      : options.speakerName;

    this.headerText = scene.add.text(padding, padding, title, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "11px",
      fontStyle: "bold",
      color: accentColor
    });

    // 2. Mensaje formateado
    const truncatedMessage =
      options.message.length > 140
        ? options.message.substring(0, 137) + "..."
        : options.message;

    this.messageText = scene.add.text(padding, padding + 16, truncatedMessage, {
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSize: "11px",
      color: "#f1f5f9",
      wordWrap: { width: maxWidth - padding * 2, useAdvancedWrap: true },
      lineSpacing: 2
    });

    const contentWidth = Math.max(
      this.headerText.width + padding * 2,
      Math.min(maxWidth, this.messageText.width + padding * 2)
    );
    const contentHeight = padding + 16 + this.messageText.height + padding;

    // 3. Gráficos de fondo con estilo Glassmorphism
    this.bgGraphics = scene.add.graphics();
    // Sombra suave profunda
    this.bgGraphics.fillStyle(0x000000, 0.45);
    this.bgGraphics.fillRoundedRect(3, 3, contentWidth, contentHeight, 8);
    // Fondo oscuro translúcido
    this.bgGraphics.fillStyle(0x0f172a, 0.95);
    this.bgGraphics.fillRoundedRect(0, 0, contentWidth, contentHeight, 8);
    // Borde brillante con resplandor
    const hexColor = Phaser.Display.Color.HexStringToColor(accentColor).color;
    this.bgGraphics.lineStyle(1.5, hexColor, 0.85);
    this.bgGraphics.strokeRoundedRect(0, 0, contentWidth, contentHeight, 8);

    // 4. Flecha inferior que apunta al emisor
    this.tailSprite = scene.add.sprite(contentWidth / 2, contentHeight + 4, "bubble_tail");
    this.tailSprite.setOrigin(0.5, 0);

    // Añadir componentes al contenedor
    this.add([this.bgGraphics, this.tailSprite, this.headerText, this.messageText]);

    // Posicionamiento centrado
    this.setPosition(x - contentWidth / 2, y - contentHeight - 20);
    this.setDepth(15000);

    // Efecto Pop-in animado
    this.setScale(0.1);
    this.setAlpha(0);

    scene.tweens.add({
      targets: this,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: "Back.easeOut"
    });

    scene.add.existing(this);

    // Temporizador de auto-cierre
    const duration = options.durationMs ?? 4500;
    this.dismissTimer = scene.time.delayedCall(duration, () => {
      this.dismiss(options.onComplete);
    });
  }

  public dismiss(onComplete?: () => void): void {
    if (this.dismissTimer) {
      this.dismissTimer.remove();
      this.dismissTimer = undefined;
    }

    this.scene.tweens.add({
      targets: this,
      scale: 0.8,
      alpha: 0,
      duration: 200,
      ease: "Power2",
      onComplete: () => {
        if (onComplete) onComplete();
        this.destroy();
      }
    });
  }
}
