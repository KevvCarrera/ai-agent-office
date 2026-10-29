import Phaser from "phaser";
import type { OfficeConfig, OfficeEvent } from "@office/shared";
import { socketClient, type AgentCurrentState } from "../network/socketClient.js";
import { Room } from "../entities/Room.js";
import { Desk } from "../entities/Desk.js";
import { AgentSprite } from "../entities/AgentSprite.js";
import { cartToIso, getIsoDepth } from "../utils/isoMath.js";

export class OfficeScene extends Phaser.Scene {
  private rooms: Room[] = [];
  private desks: Map<string, Desk> = new Map();
  private agents: Map<string, AgentSprite> = new Map();

  // Hub Central visual entities
  private smartboardSprite?: Phaser.GameObjects.Sprite;
  private meetingTableSprite?: Phaser.GameObjects.Sprite;
  private coffeeStationSprite?: Phaser.GameObjects.Sprite;
  private hubChairs: Phaser.GameObjects.Sprite[] = [];

  // Puestos en la mesa de reuniones del Hub Central
  private hubSeats = {
    west: { x: -44, y: 0 },
    north: { x: 0, y: -22 },
    east: { x: 44, y: 0 },
    south: { x: 0, y: 22 }
  };

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;

  constructor() {
    super({ key: "OfficeScene" });
  }

  create(): void {
    this.createLoftFloorAndHub();
    this.setupCameraControls();
    this.setupSocketSubscription();

    // Notificar cuando la escena esté lista
    this.events.emit("scene:ready");
  }

  /**
   * Construye el suelo isométrico general, el Hub Central de Reuniones y la estación de café
   */
  private createLoftFloorAndHub(): void {
    // 1. Suelo general de Parquet de Madera Cálida en cuadrícula isométrica (-9 a 9)
    for (let gx = -9; gx <= 9; gx++) {
      for (let gy = -9; gy <= 9; gy++) {
        const iso = cartToIso(gx, gy);

        // Pasillos principales en hormigón pulido gris tecnológico
        const isHallway = Math.abs(gx) <= 1 || Math.abs(gy) <= 1;
        const isHub = Math.abs(gx) <= 3 && Math.abs(gy) <= 3;

        let tileKey = "iso_floor_parquet";
        if (isHub) {
          tileKey = "iso_carpet_hub";
        } else if (isHallway) {
          tileKey = "iso_floor_concrete";
        }

        const tile = this.add.sprite(iso.x, iso.y, tileKey);
        tile.setOrigin(0.5, 0.5);
        tile.setDepth(0);
      }
    }

    // 2. Hub Central: Columnas de loft de acero en las esquinas
    const hubCorners = [
      { x: -3.5, y: -3.5 },
      { x: 3.5, y: -3.5 },
      { x: -3.5, y: 3.5 },
      { x: 3.5, y: 3.5 }
    ];

    hubCorners.forEach((corner) => {
      const iso = cartToIso(corner.x, corner.y);
      const pillar = this.add.sprite(iso.x, iso.y - 12, "iso_loft_pillar");
      pillar.setOrigin(0.5, 0.5);
      pillar.setDepth(getIsoDepth(iso.y, 0, 15));
    });

    // 3. Hub Central: Gran Mesa Ovalada de Conferencias en (0, 0)
    const tableIso = cartToIso(0, 0);
    this.meetingTableSprite = this.add.sprite(tableIso.x, tableIso.y, "iso_meeting_table");
    this.meetingTableSprite.setOrigin(0.5, 0.5);
    this.meetingTableSprite.setDepth(getIsoDepth(tableIso.y, 0, 10));

    // Sillas alrededor de la mesa de reuniones
    const chairPositions = [
      { x: -44, y: 0, flip: false },
      { x: 44, y: 0, flip: true },
      { x: 0, y: -22, flip: false },
      { x: 0, y: 22, flip: false }
    ];

    chairPositions.forEach((pos) => {
      const chair = this.add.sprite(tableIso.x + pos.x, tableIso.y + pos.y, "iso_chair_desk");
      chair.setOrigin(0.5, 0.5);
      chair.setFlipX(pos.flip);
      chair.setDepth(getIsoDepth(tableIso.y + pos.y, 0, 8));
      this.hubChairs.push(chair);
    });

    // 4. Hub Central: Pizarra / Pantalla Inteligente (Smart Board) en el fondo del Hub
    const boardIso = cartToIso(0, -2.5);
    this.smartboardSprite = this.add.sprite(boardIso.x, boardIso.y - 12, "iso_smartboard_idle");
    this.smartboardSprite.setOrigin(0.5, 0.5);
    this.smartboardSprite.setDepth(getIsoDepth(boardIso.y, 0, 12));

    // 5. Hub Central: Estación de Café Lounge en lateral izquierdo
    const coffeeIso = cartToIso(-2.5, -1.5);
    this.coffeeStationSprite = this.add.sprite(coffeeIso.x, coffeeIso.y - 10, "iso_coffee_station");
    this.coffeeStationSprite.setOrigin(0.5, 0.5);
    this.coffeeStationSprite.setDepth(getIsoDepth(coffeeIso.y, 0, 12));

    // 6. Hub Central: Plantas interiores estilizadas
    const plant1Iso = cartToIso(2.5, -1.5);
    const plant1 = this.add.sprite(plant1Iso.x, plant1Iso.y - 10, "iso_plant_fiddle");
    plant1.setOrigin(0.5, 0.5);
    plant1.setDepth(getIsoDepth(plant1Iso.y, 0, 12));

    const plant2Iso = cartToIso(2.5, 2.5);
    const plant2 = this.add.sprite(plant2Iso.x, plant2Iso.y - 6, "potted_plant");
    plant2.setOrigin(0.5, 0.5);
    plant2.setDepth(getIsoDepth(plant2Iso.y, 0, 12));
  }

  /**
   * Configura controles de cámara suaves: Pan y Zoom con centrado en Hub Central
   */
  private setupCameraControls(): void {
    const cam = this.cameras.main;

    // Centrar inicialmente la cámara en (0, 0) - Hub Central
    this.centerCamera();

    // 1. Arrastre (Pan)
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
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

    // 2. Zoom suave (0.5x a 2.5x)
    this.input.on("wheel", (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      const zoomFactor = deltaY > 0 ? 0.92 : 1.08;
      const newZoom = Phaser.Math.Clamp(cam.zoom * zoomFactor, 0.5, 2.5);
      cam.setZoom(newZoom);
    });
  }

  /**
   * Centra suavemente la vista en el Hub Central (0, 0)
   */
  public centerCamera(): void {
    const cam = this.cameras.main;
    cam.pan(0, 0, 500, "Power2");
    cam.zoomTo(1.15, 500, "Power2");
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

    // En caso de que la configuración ya esté en caché
    const cachedConfig = socketClient.getConfig();
    if (cachedConfig) {
      this.buildOfficeFromConfig(cachedConfig);
    }
  }

  /**
   * Construye las salas, escritorios y agentes en perspectiva isométrica
   */
  public buildOfficeFromConfig(config: OfficeConfig): void {
    this.agents.forEach((agent) => agent.destroy());
    this.agents.clear();

    this.desks.forEach((desk) => desk.destroy());
    this.desks.clear();

    this.rooms.forEach((room) => room.destroy());
    this.rooms = [];

    // 1. Construir Salas Isométricas
    for (const office of config.offices) {
      const room = new Room(this, office);
      this.rooms.push(room);

      // 2. Construir Escritorio Isométrico Asignado
      const desk = new Desk(this, {
        id: `desk_${office.id}`,
        gridX: office.desk_coords.x,
        gridY: office.desk_coords.y,
        agentId: office.assigned_agent
      });
      this.desks.set(office.assigned_agent, desk);
    }

    // 3. Instanciar Agentes en sus Escritorios
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

  /**
   * Maneja eventos entrantes con soporte para colaboración en Hub Central o despacho
   */
  private handleIncomingEvent(event: OfficeEvent): void {
    const agent = this.agents.get(event.agentId);
    if (agent) {
      agent.handleEvent(event, this.agents, (initiator, target, ev) => {
        this.triggerHubMeeting(initiator, target, ev);
      });
    }
  }

  /**
   * Convocatoria al Hub Central para revisiones de código, especificaciones y entregables
   */
  private triggerHubMeeting(
    initiator: AgentSprite,
    target: AgentSprite,
    event: OfficeEvent
  ): void {
    // Encender la pantalla inteligente del Hub con diagrama de arquitectura / review
    if (this.smartboardSprite) {
      this.smartboardSprite.setTexture("iso_smartboard_active");
    }

    // Determinar asientos en la mesa ovalada
    const seat1 = this.hubSeats.west;
    const seat2 = this.hubSeats.east;

    let arrivedCount = 0;
    const onParticipantArrived = () => {
      arrivedCount++;
      if (arrivedCount === 2) {
        // Ambos llegaron a la mesa: iniciar diálogo
        initiator.showCollaborationBubble(target, event, () => {
          // Finalizado el diálogo: apagar pizarra inteligente y regresar a puestos
          if (this.smartboardSprite) {
            this.smartboardSprite.setTexture("iso_smartboard_idle");
          }
          initiator.walkBackHome();
          target.walkBackHome();
        });
      }
    };

    initiator.walkToMeeting(seat1.x, seat1.y, onParticipantArrived);
    target.walkToMeeting(seat2.x, seat2.y, onParticipantArrived);
  }

  private syncAgentStates(states: Record<string, AgentCurrentState>): void {
    for (const [agentId, stateData] of Object.entries(states)) {
      const agent = this.agents.get(agentId);
      if (agent && stateData.lastEvent) {
        agent.handleEvent(stateData.lastEvent, this.agents, (initiator, target, ev) => {
          this.triggerHubMeeting(initiator, target, ev);
        });
      }
    }
  }

  public getAgentsMap(): Map<string, AgentSprite> {
    return this.agents;
  }
}
