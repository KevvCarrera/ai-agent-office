import Phaser from "phaser";
import type { OfficeRoom } from "@office/shared";
import { cartToIso, getIsoDepth } from "../utils/isoMath.js";

export interface RoomLayout {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  carpetTexture: string;
  emoji: string;
  accentColor: string;
}

export class Room extends Phaser.GameObjects.Container {
  public roomData: OfficeRoom;
  public layout: RoomLayout;

  constructor(scene: Phaser.Scene, room: OfficeRoom, _tileSize?: number) {
    super(scene, 0, 0);

    this.roomData = room;
    this.layout = this.determineLayout(room);

    this.renderFloor(scene);
    this.renderWallsAndPartitions(scene);
    this.renderPlaque(scene);
    this.renderDecorations(scene);

    this.setDepth(5);
    scene.add.existing(this);
  }

  private determineLayout(room: OfficeRoom): RoomLayout {
    if (room.id === "architecture_room") {
      return {
        minX: room.desk_coords.x - 2,
        maxX: room.desk_coords.x + 2,
        minY: room.desk_coords.y - 2,
        maxY: room.desk_coords.y + 2,
        carpetTexture: "iso_carpet_amber",
        emoji: "🏛️",
        accentColor: "#f59e0b"
      };
    } else if (room.id === "dev_lab") {
      return {
        minX: room.desk_coords.x - 2,
        maxX: room.desk_coords.x + 2,
        minY: room.desk_coords.y - 2,
        maxY: room.desk_coords.y + 2,
        carpetTexture: "iso_carpet_cyan",
        emoji: "⚡",
        accentColor: "#06b6d4"
      };
    } else if (room.id === "qa_office") {
      return {
        minX: room.desk_coords.x - 2,
        maxX: room.desk_coords.x + 2,
        minY: room.desk_coords.y - 2,
        maxY: room.desk_coords.y + 2,
        carpetTexture: "iso_carpet_emerald",
        emoji: "🔍",
        accentColor: "#10b981"
      };
    }

    return {
      minX: room.desk_coords.x - 2,
      maxX: room.desk_coords.x + 2,
      minY: room.desk_coords.y - 2,
      maxY: room.desk_coords.y + 2,
      carpetTexture: "iso_floor_concrete",
      emoji: "🏢",
      accentColor: "#38bdf8"
    };
  }

  private renderFloor(scene: Phaser.Scene): void {
    for (let gx = this.layout.minX; gx <= this.layout.maxX; gx++) {
      for (let gy = this.layout.minY; gy <= this.layout.maxY; gy++) {
        const iso = cartToIso(gx, gy);
        const floorTile = scene.add.sprite(iso.x, iso.y, this.layout.carpetTexture);
        floorTile.setOrigin(0.5, 0.5);
        floorTile.setDepth(1);
        this.add(floorTile);
      }
    }
  }

  private renderWallsAndPartitions(scene: Phaser.Scene): void {
    const { minX, maxX, minY, maxY } = this.layout;

    // Mamparas de cristal translúcido en los bordes superiores (minY y minX)
    for (let gx = minX; gx <= maxX; gx++) {
      const iso = cartToIso(gx, minY - 0.5);
      const glass = scene.add.sprite(iso.x, iso.y, "iso_glass_divider_right");
      glass.setOrigin(0.5, 0.5);
      glass.setDepth(getIsoDepth(iso.y, 0, 5));
      this.add(glass);
    }

    for (let gy = minY; gy <= maxY; gy++) {
      const iso = cartToIso(minX - 0.5, gy);
      const glass = scene.add.sprite(iso.x, iso.y, "iso_glass_divider_left");
      glass.setOrigin(0.5, 0.5);
      glass.setDepth(getIsoDepth(iso.y, 0, 5));
      this.add(glass);
    }

    // Columna de loft en la esquina
    const cornerIso = cartToIso(minX - 0.5, minY - 0.5);
    const pillar = scene.add.sprite(cornerIso.x, cornerIso.y - 12, "iso_loft_pillar");
    pillar.setOrigin(0.5, 0.5);
    pillar.setDepth(getIsoDepth(cornerIso.y, 0, 15));
    this.add(pillar);
  }

  private renderPlaque(scene: Phaser.Scene): void {
    const centerCartX = (this.layout.minX + this.layout.maxX) / 2;
    const topCartY = this.layout.minY - 0.6;
    const iso = cartToIso(centerCartX, topCartY);

    const plaqueBg = scene.add.sprite(iso.x, iso.y - 20, "room_plaque");
    plaqueBg.setOrigin(0.5, 0.5);
    plaqueBg.setDepth(getIsoDepth(iso.y, 1, 40));

    const titleText = scene.add.text(
      iso.x,
      iso.y - 20,
      `${this.layout.emoji} ${this.roomData.name}`,
      {
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "11px",
        fontStyle: "bold",
        color: this.layout.accentColor
      }
    );
    titleText.setOrigin(0.5, 0.5);
    titleText.setDepth(getIsoDepth(iso.y, 1, 41));

    this.add([plaqueBg, titleText]);
  }

  private renderDecorations(scene: Phaser.Scene): void {
    // Planta estilizada en la esquina
    const plantIso = cartToIso(this.layout.minX + 0.2, this.layout.minY + 0.2);
    const plant = scene.add.sprite(plantIso.x, plantIso.y - 8, "iso_plant_fiddle");
    plant.setOrigin(0.5, 0.5);
    plant.setDepth(getIsoDepth(plantIso.y, 0, 12));
    this.add(plant);

    // Servidor rack para el despacho backend
    if (this.roomData.id === "dev_lab") {
      const serverIso = cartToIso(this.layout.maxX - 0.2, this.layout.minY + 0.2);
      const server = scene.add.sprite(serverIso.x, serverIso.y - 12, "iso_server_rack");
      server.setOrigin(0.5, 0.5);
      server.setDepth(getIsoDepth(serverIso.y, 0, 12));
      this.add(server);
    }
  }
}
