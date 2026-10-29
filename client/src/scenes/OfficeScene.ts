import Phaser from "phaser";
import type { OfficeConfig, OfficeEvent } from "@office/shared";
import { socketClient, type AgentCurrentState } from "../network/socketClient.js";
import { Room } from "../entities/Room.js";
import { Desk } from "../entities/Desk.js";
import { AgentSprite } from "../entities/AgentSprite.js";

export class OfficeScene extends Phaser.Scene {
  private tileSize = 48;
  private officeBounds = {
    minX: 0,
    maxX: 15,
    minY: 0,
    maxY: 11
  };

  private rooms: Room[] = [];
  private desks: Map<string, Desk> = new Map();
  private agents: Map<string, AgentSprite> = new Map();

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor() {
    super({ key: "OfficeScene" });
  }

  create(): void {
    this.createHallwayAndCommonAreas();
    this.setupCameraControls();
    this.setupSocketSubscription();

    // Notificar cuando la escena esté lista
    this.events.emit("scene:ready");
  }

  /**
   * Renderiza el suelo general de parquet, paredes exteriores y zonas comunes
   */
  private createHallwayAndCommonAreas(): void {
    const { minX, maxX, minY, maxY } = this.officeBounds;

    // 1. Suelo base de parquet en todo el edificio
    for (let gx = minX; gx <= maxX; gx++) {
      for (let gy = minY; gy <= maxY; gy++) {
        const tile = this.add.sprite(
          gx * this.tileSize,
          gy * this.tileSize,
          "floor_parquet"
        );
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(0);
      }
    }

    // 2. Muros perimetrales
    for (let gx = minX; gx <= maxX; gx++) {
      const topWall = this.add.sprite(
        gx * this.tileSize,
        minY * this.tileSize - 12,
        "wall_solid_h"
      );
      topWall.setOrigin(0.5, 0.5);
      topWall.setDepth(40);
    }

    for (let gy = minY; gy <= maxY; gy++) {
      const leftWall = this.add.sprite(
        minX * this.tileSize - 8,
        gy * this.tileSize,
        "wall_solid_v"
      );
      leftWall.setOrigin(0.5, 0.5);
      leftWall.setDepth(40);

      const rightWall = this.add.sprite(
        maxX * this.tileSize + 8,
        gy * this.tileSize,
        "wall_solid_v"
      );
      rightWall.setOrigin(0.5, 0.5);
      rightWall.setDepth(40);
    }

    // 3. Área común: Dispensador de agua y plantas en el vestíbulo
    const waterCooler = this.add.sprite(1 * this.tileSize, 6 * this.tileSize, "water_cooler");
    waterCooler.setOrigin(0.5, 0.5);
    waterCooler.setDepth(6 * this.tileSize + 10);

    const cornerPlant = this.add.sprite(1 * this.tileSize, 8 * this.tileSize, "potted_plant");
    cornerPlant.setOrigin(0.5, 0.5);
    cornerPlant.setDepth(8 * this.tileSize + 10);

    // Servidores en el lateral derecho
    const server1 = this.add.sprite(14 * this.tileSize, 6 * this.tileSize, "server_rack");
    server1.setOrigin(0.5, 0.5);
    server1.setDepth(6 * this.tileSize + 10);

    const server2 = this.add.sprite(14 * this.tileSize, 8 * this.tileSize, "server_rack");
    server2.setOrigin(0.5, 0.5);
    server2.setDepth(8 * this.tileSize + 10);
  }

  /**
   * Configura arrastre (pan) y zoom con la rueda del ratón
   */
  private setupCameraControls(): void {
    const cam = this.cameras.main;

    // Centrar inicialmente la cámara en la oficina
    this.centerCamera();

    // 1. Arrastre (Pan)
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      // Si se pulsa botón principal o secundario
      if (pointer.button === 0 || pointer.button === 2) {
        this.isDragging = true;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (this.isDragging) {
        const dx = (this.dragStartX - pointer.x) / cam.zoom;
        const dy = (this.dragStartY - pointer.y) / cam.zoom;
        cam.scrollX += dx;
        cam.scrollY += dy;
        this.dragStartX = pointer.x;
        this.dragStartY = pointer.y;
      }
    });

    this.input.on("pointerup", () => {
      this.isDragging = false;
    });

    // 2. Zoom con la rueda del ratón
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Phaser.Math.Clamp(cam.zoom * zoomFactor, 0.55, 2.2);
      cam.setZoom(newZoom);
    });
  }

  /**
   * Centra suavemente la vista en el centro de la oficina
   */
  public centerCamera(): void {
    const cam = this.cameras.main;
    const centerX = ((this.officeBounds.minX + this.officeBounds.maxX) / 2) * this.tileSize;
    const centerY = ((this.officeBounds.minY + this.officeBounds.maxY) / 2) * this.tileSize;

    cam.pan(centerX, centerY, 500, "Power2");
    cam.zoomTo(1.0, 500, "Power2");
  }

  /**
   * Suscripción a eventos de red Socket.io
   */
  private setupSocketSubscription(): void {
    // 1. Cargar configuración inicial
    socketClient.onConfig((config: OfficeConfig) => {
      this.buildOfficeFromConfig(config);
    });

    // 2. Escuchar eventos en vivo de los agentes
    socketClient.onEvent((event: OfficeEvent) => {
      this.handleIncomingEvent(event);
    });

    // 3. Escuchar estados agregados iniciales
    socketClient.onAgentsState((states: Record<string, AgentCurrentState>) => {
      this.syncAgentStates(states);
    });

    // En caso de que la configuración ya esté en caché en socketClient
    const cachedConfig = socketClient.getConfig();
    if (cachedConfig) {
      this.buildOfficeFromConfig(cachedConfig);
    }
  }

  /**
   * Construye dinámicamente las salas, escritorios y agentes según la configuración
   */
  public buildOfficeFromConfig(config: OfficeConfig): void {
    // Limpiar agentes anteriores si existen
    this.agents.forEach((agent) => agent.destroy());
    this.agents.clear();

    this.desks.forEach((desk) => desk.destroy());
    this.desks.clear();

    this.rooms.forEach((room) => room.destroy());
    this.rooms = [];

    // 1. Construir Salas
    for (const office of config.offices) {
      const room = new Room(this, office, this.tileSize);
      this.rooms.push(room);

      // 2. Construir Escritorio asignado
      const desk = new Desk(this, {
        id: `desk_${office.id}`,
        gridX: office.desk_coords.x,
        gridY: office.desk_coords.y,
        tileSize: this.tileSize,
        agentId: office.assigned_agent
      });
      this.desks.set(office.assigned_agent, desk);
    }

    // 3. Instanciar Agentes
    for (const agentMeta of config.agents) {
      const desk = this.desks.get(agentMeta.id);
      if (desk) {
        const agentSprite = new AgentSprite(this, agentMeta, desk);
        this.agents.set(agentMeta.id, agentSprite);
      }
    }

    // Sincronizar estados actuales
    const states = socketClient.getAgentStates();
    if (Object.keys(states).length > 0) {
      this.syncAgentStates(states);
    }
  }

  private handleIncomingEvent(event: OfficeEvent): void {
    const agent = this.agents.get(event.agentId);
    if (agent) {
      agent.handleEvent(event, this.agents);
    }
  }

  private syncAgentStates(states: Record<string, AgentCurrentState>): void {
    for (const [agentId, stateData] of Object.entries(states)) {
      const agent = this.agents.get(agentId);
      if (agent && stateData.lastEvent) {
        agent.handleEvent(stateData.lastEvent, this.agents);
      }
    }
  }

  public getAgentsMap(): Map<string, AgentSprite> {
    return this.agents;
  }
}
