import Phaser from "phaser";
import type { OfficeRoom } from "@office/shared";

export interface RoomLayout {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  carpetTexture: string;
  emoji: string;
}

export class Room extends Phaser.GameObjects.Container {
  public roomData: OfficeRoom;
  public layout: RoomLayout;
  private tileSize: number;

  constructor(scene: Phaser.Scene, room: OfficeRoom, tileSize: number) {
    super(scene, 0, 0);

    this.roomData = room;
    this.tileSize = tileSize;
    this.layout = this.determineLayout(room);

    this.renderFloor(scene);
    this.renderWallsAndPartitions(scene);
    this.renderPlaque(scene);
    this.renderDecorations(scene);

    this.setDepth(5);
    scene.add.existing(this);
  }

  private determineLayout(room: OfficeRoom): RoomLayout {
    // Definir áreas alrededor de las coordenadas de cada sala
    if (room.id === "architecture_room") {
      return {
        minX: room.desk_coords.x - 2,
        maxX: room.desk_coords.x + 2,
        minY: room.desk_coords.y - 2,
        maxY: room.desk_coords.y + 2,
        carpetTexture: "carpet_blue",
        emoji: "🏛️"
      };
    } else if (room.id === "dev_lab") {
      return {
        minX: room.desk_coords.x - 2,
        maxX: room.desk_coords.x + 2,
        minY: room.desk_coords.y - 2,
        maxY: room.desk_coords.y + 2,
        carpetTexture: "carpet_green",
        emoji: "⚡"
      };
    } else if (room.id === "qa_office") {
      return {
        minX: room.desk_coords.x - 2,
        maxX: room.desk_coords.x + 2,
        minY: room.desk_coords.y - 2,
        maxY: room.desk_coords.y + 2,
        carpetTexture: "carpet_purple",
        emoji: "🔍"
      };
    }

    // Configuración general por defecto
    return {
      minX: room.desk_coords.x - 2,
      maxX: room.desk_coords.x + 2,
      minY: room.desk_coords.y - 2,
      maxY: room.desk_coords.y + 2,
      carpetTexture: "carpet_amber",
      emoji: "🏢"
    };
  }

  private renderFloor(scene: Phaser.Scene): void {
    for (let gx = this.layout.minX; gx <= this.layout.maxX; gx++) {
      for (let gy = this.layout.minY; gy <= this.layout.maxY; gy++) {
        const floorTile = scene.add.sprite(
          gx * this.tileSize,
          gy * this.tileSize,
          this.layout.carpetTexture
        );
        floorTile.setOrigin(0.5, 0.5);
        floorTile.setDepth(1);
        this.add(floorTile);
      }
    }
  }

  private renderWallsAndPartitions(scene: Phaser.Scene): void {
    const { minX, maxX, minY, maxY } = this.layout;

    // Paredes de cristal / separadores entre salas
    // Borde superior
    for (let gx = minX; gx <= maxX; gx++) {
      const topDivider = scene.add.sprite(
        gx * this.tileSize,
        minY * this.tileSize - this.tileSize / 2,
        "divider_glass_h"
      );
      topDivider.setOrigin(0.5, 0.5);
      topDivider.setDepth(20);
      this.add(topDivider);
    }

    // Puerta de entrada (hueco central en borde inferior)
    const doorX = Math.round((minX + maxX) / 2);
    const doorMat = scene.add.sprite(
      doorX * this.tileSize,
      maxY * this.tileSize + this.tileSize / 2,
      "door_mat"
    );
    doorMat.setOrigin(0.5, 0.5);
    doorMat.setDepth(2);
    this.add(doorMat);

    // Separadores laterales
    for (let gy = minY; gy <= maxY; gy++) {
      const leftDiv = scene.add.sprite(
        minX * this.tileSize - this.tileSize / 2,
        gy * this.tileSize,
        "divider_glass_v"
      );
      leftDiv.setOrigin(0.5, 0.5);
      leftDiv.setDepth(20);
      this.add(leftDiv);

      const rightDiv = scene.add.sprite(
        maxX * this.tileSize + this.tileSize / 2,
        gy * this.tileSize,
        "divider_glass_v"
      );
      rightDiv.setOrigin(0.5, 0.5);
      rightDiv.setDepth(20);
      this.add(rightDiv);
    }
  }

  private renderPlaque(scene: Phaser.Scene): void {
    const centerX = Math.round((this.layout.minX + this.layout.maxX) / 2) * this.tileSize;
    const topY = this.layout.minY * this.tileSize - this.tileSize / 2 - 14;

    const plaqueBg = scene.add.sprite(centerX, topY, "room_plaque");
    plaqueBg.setOrigin(0.5, 0.5);
    plaqueBg.setDepth(30);

    const titleText = scene.add.text(
      centerX,
      topY,
      `${this.layout.emoji} ${this.roomData.name}`,
      {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: "#fbbf24"
      }
    );
    titleText.setOrigin(0.5, 0.5);
    titleText.setDepth(31);

    this.add([plaqueBg, titleText]);
  }

  private renderDecorations(scene: Phaser.Scene): void {
    // Planta decorativa en la esquina superior izquierda
    const plantX = this.layout.minX * this.tileSize;
    const plantY = this.layout.minY * this.tileSize;
    const plant = scene.add.sprite(plantX, plantY, "potted_plant");
    plant.setOrigin(0.5, 0.5);
    plant.setDepth(plantY + 10);
    this.add(plant);
  }
}
