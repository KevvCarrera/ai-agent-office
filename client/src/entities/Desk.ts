import Phaser from "phaser";

export interface DeskConfig {
  id: string;
  gridX: number;
  gridY: number;
  tileSize: number;
  agentId?: string;
}

export class Desk extends Phaser.GameObjects.Container {
  public deskId: string;
  public gridX: number;
  public gridY: number;
  public tileSize: number;

  private deskSprite: Phaser.GameObjects.Sprite;
  private monitorSprite: Phaser.GameObjects.Sprite;
  private chairSprite: Phaser.GameObjects.Sprite;
  private coffeeSprite: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, config: DeskConfig) {
    const worldX = config.gridX * config.tileSize;
    const worldY = config.gridY * config.tileSize;

    super(scene, worldX, worldY);

    this.deskId = config.id;
    this.gridX = config.gridX;
    this.gridY = config.gridY;
    this.tileSize = config.tileSize;

    // Silla detrás/bajo el escritorio
    this.chairSprite = scene.add.sprite(0, 10, "office_chair");
    this.chairSprite.setOrigin(0.5, 0.5);

    // Tablero de mesa
    this.deskSprite = scene.add.sprite(0, 0, "desk_wood");
    this.deskSprite.setOrigin(0.5, 0.5);

    // Monitor centrado sobre el escritorio
    this.monitorSprite = scene.add.sprite(0, -6, "monitor_idle");
    this.monitorSprite.setOrigin(0.5, 0.5);

    // Taza de café a la derecha
    this.coffeeSprite = scene.add.sprite(22, 6, "coffee_cup");
    this.coffeeSprite.setOrigin(0.5, 0.5);

    this.add([this.chairSprite, this.deskSprite, this.monitorSprite, this.coffeeSprite]);
    this.setDepth(worldY + 10);

    scene.add.existing(this);
  }

  /**
   * Cambia el estado visual del monitor (reposo vs código activo)
   */
  public setWorking(working: boolean): void {
    this.monitorSprite.setTexture(working ? "monitor_code" : "monitor_idle");
  }

  /**
   * Coordenadas donde se sienta el agente asignado
   */
  public getSeatPosition(): { x: number; y: number } {
    return {
      x: this.x,
      y: this.y + 4
    };
  }

  /**
   * Coordenadas donde se sitúa un agente visitante para colaborar
   */
  public getVisitorPosition(): { x: number; y: number } {
    return {
      x: this.x + 48,
      y: this.y + 12
    };
  }
}
