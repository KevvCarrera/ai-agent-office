import Phaser from "phaser";
import { cartToIso, getIsoDepth } from "../utils/isoMath.js";

export interface DeskConfig {
  id: string;
  gridX: number;
  gridY: number;
  tileSize?: number;
  agentId?: string;
}

export class Desk extends Phaser.GameObjects.Container {
  public deskId: string;
  public gridX: number;
  public gridY: number;

  private deskSprite: Phaser.GameObjects.Sprite;
  private monitorSprite: Phaser.GameObjects.Sprite;
  private chairSprite: Phaser.GameObjects.Sprite;
  private coffeeSprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, config: DeskConfig) {
    const isoPos = cartToIso(config.gridX, config.gridY);

    super(scene, isoPos.x, isoPos.y);

    this.deskId = config.id;
    this.gridX = config.gridX;
    this.gridY = config.gridY;

    // Silla de oficina ergonómica detrás/bajo el escritorio
    this.chairSprite = scene.add.sprite(0, -2, "iso_chair_desk");
    this.chairSprite.setOrigin(0.5, 0.5);

    // Tablero principal de madera en ángulo 2.5D
    this.deskSprite = scene.add.sprite(0, 0, "iso_desk_wood");
    this.deskSprite.setOrigin(0.5, 0.5);

    // Monitor curvo ultrawide 34" sobre el escritorio
    this.monitorSprite = scene.add.sprite(0, -12, "iso_monitor_ultrawide_idle");
    this.monitorSprite.setOrigin(0.5, 0.5);

    // Taza de café humeante en la esquina de la mesa
    this.coffeeSprite = scene.add.sprite(18, -4, "coffee_cup");
    this.coffeeSprite.setOrigin(0.5, 0.5);

    this.add([this.chairSprite, this.deskSprite, this.monitorSprite, this.coffeeSprite]);
    this.setDepth(getIsoDepth(isoPos.y, 0, 10));

    scene.add.existing(this);
  }

  /**
   * Cambia el estado visual del monitor ultrawide (reposo vs código activo VSCode)
   */
  public setWorking(working: boolean): void {
    this.monitorSprite.setTexture(
      working ? "iso_monitor_ultrawide_code" : "iso_monitor_ultrawide_idle"
    );
  }

  /**
   * Coordenadas donde se sienta el agente asignado (frente al monitor)
   */
  public getSeatPosition(): { x: number; y: number } {
    return {
      x: this.x,
      y: this.y + 2
    };
  }

  /**
   * Coordenadas donde se sitúa un agente visitante en perspectiva isométrica
   */
  public getVisitorPosition(): { x: number; y: number } {
    return {
      x: this.x + 32,
      y: this.y + 16
    };
  }
}
