import { EventEmitter } from "node:events";
import crypto from "node:crypto";
import type { OfficeConfig, OfficeEvent, AgentState, EventType } from "@office/shared";

export interface MockStepDefinition {
  agentId: string;
  type: EventType;
  state: AgentState;
  targetAgentId?: string;
  content: string;
  toolName?: string;
  provider?: string;
}

/**
 * Generador de eventos mock para simulación continua o paso a paso de una jornada de oficina virtual.
 */
export class MockGenerator extends EventEmitter {
  private timer: NodeJS.Timeout | null = null;
  private currentStepIndex: number = 0;
  private isSimulating: boolean = false;
  private config?: OfficeConfig;
  private stepIntervalMs: number = 2500;

  constructor(config?: OfficeConfig) {
    super();
    this.config = config;
  }

  /**
   * Actualiza la configuración de agentes asignada al simulador.
   */
  setConfig(config: OfficeConfig): void {
    this.config = config;
  }

  /**
   * Resuelve los IDs de agentes principales para la narrativa basada en la configuración.
   */
  private resolveAgentIds(): { architect: string; dev: string; qa: string } {
    const agents = this.config?.agents || [];
    const findId = (pattern: string, fallback: string) => {
      const found = agents.find((a) => a.id.toLowerCase().includes(pattern) || a.name.toLowerCase().includes(pattern));
      return found ? found.id : fallback;
    };

    return {
      architect: findId("arch", "architect"),
      dev: findId("dev", "backend-developer"),
      qa: findId("qa", "qa-engineer")
    };
  }

  /**
   * Genera el libreto narrativo de la jornada colaborativa.
   */
  private getStoryScript(): MockStepDefinition[] {
    const { architect, dev, qa } = this.resolveAgentIds();

    return [
      {
        agentId: architect,
        type: "STATE_CHANGE",
        state: "THINKING",
        content: "Analizando requerimientos de arquitectura del sistema...",
        provider: "Claude"
      },
      {
        agentId: architect,
        type: "TOOL_CALLED",
        state: "TYPING",
        toolName: "read_spec",
        content: "Leyendo SPEC-002 y diseñando diagrama de componentes",
        provider: "Claude"
      },
      {
        agentId: architect,
        type: "STATE_CHANGE",
        state: "TYPING",
        content: "Redactando contrato OpenAPI y modelos de datos en TypeScript",
        provider: "Claude"
      },
      {
        agentId: architect,
        type: "MESSAGE_SENT",
        state: "WALKING",
        targetAgentId: dev,
        content: "Revisa la API de sincronización y modelos de datos",
        provider: "Claude"
      },
      {
        agentId: dev,
        type: "COLLABORATION_START",
        state: "MESSAGING",
        targetAgentId: architect,
        content: "Recibido. Coordinando estructura de endpoints con Arquitectura",
        provider: "Gemini"
      },
      {
        agentId: architect,
        type: "COLLABORATION_END",
        state: "IDLE",
        content: "Regresando al puesto tras sincronización",
        provider: "Claude"
      },
      {
        agentId: dev,
        type: "STATE_CHANGE",
        state: "THINKING",
        content: "Diseñando arquitectura de watchers incrementales con Chokidar...",
        provider: "Gemini"
      },
      {
        agentId: dev,
        type: "TOOL_CALLED",
        state: "TYPING",
        toolName: "write_file",
        content: "Implementando parsers y gestor de sockets en TypeScript",
        provider: "Gemini"
      },
      {
        agentId: dev,
        type: "MESSAGE_SENT",
        state: "WALKING",
        targetAgentId: qa,
        content: "Código listo para auditoría y suite de pruebas unitarias",
        provider: "Gemini"
      },
      {
        agentId: qa,
        type: "COLLABORATION_START",
        state: "MESSAGING",
        targetAgentId: dev,
        content: "Iniciando verificación de cobertura y criterios de aceptación",
        provider: "Claude"
      },
      {
        agentId: qa,
        type: "TOOL_CALLED",
        state: "TYPING",
        toolName: "run_command",
        content: "Ejecutando suite Vitest (tests de parsers, config y mock)",
        provider: "Claude"
      },
      {
        agentId: qa,
        type: "STATE_CHANGE",
        state: "TYPING",
        content: "Todas las pruebas pasando al 100% (APPROVED - LGTM)",
        provider: "Claude"
      },
      {
        agentId: qa,
        type: "COLLABORATION_END",
        state: "IDLE",
        content: "Entregable verificado con éxito",
        provider: "Claude"
      },
      {
        agentId: dev,
        type: "STATE_CHANGE",
        state: "IDLE",
        content: "Módulo integrado en el servidor daemon",
        provider: "Gemini"
      }
    ];
  }

  /**
   * Crea una instancia de OfficeEvent a partir de una definición de paso.
   */
  private createEventFromStep(step: MockStepDefinition): OfficeEvent {
    return {
      id: `mock-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`,
      timestamp: new Date().toISOString(),
      agentId: step.agentId,
      type: step.type,
      state: step.state,
      targetAgentId: step.targetAgentId,
      content: step.content,
      toolName: step.toolName,
      provider: step.provider || "MockSimulator",
      watch_type: "jsonl_stream",
      metadata: { simulated: true, stepIndex: this.currentStepIndex }
    };
  }

  /**
   * Emite un único paso de la simulación y avanza el cursor circular.
   */
  emitSingleStep(): OfficeEvent {
    const script = this.getStoryScript();
    const step = script[this.currentStepIndex % script.length];
    this.currentStepIndex = (this.currentStepIndex + 1) % script.length;

    const event = this.createEventFromStep(step);
    this.emit("event", event);
    return event;
  }

  /**
   * Emite todos los eventos correspondientes a un ciclo completo de simulación.
   */
  emitSingleCycle(): OfficeEvent[] {
    const script = this.getStoryScript();
    const events: OfficeEvent[] = [];

    for (let i = 0; i < script.length; i++) {
      const step = script[i];
      const event = this.createEventFromStep(step);
      events.push(event);
      this.emit("event", event);
    }

    return events;
  }

  /**
   * Inicia el ciclo continuo de simulación periódica.
   */
  start(intervalMs?: number): void {
    if (this.isSimulating) return;

    if (intervalMs && intervalMs > 0) {
      this.stepIntervalMs = intervalMs;
    }

    this.isSimulating = true;
    // Emitir inmediatamente el primer paso
    this.emitSingleStep();

    this.timer = setInterval(() => {
      this.emitSingleStep();
    }, this.stepIntervalMs);
  }

  /**
   * Detiene la simulación continua.
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isSimulating = false;
  }

  /**
   * Comprueba si la simulación está actualmente en ejecución.
   */
  isRunning(): boolean {
    return this.isSimulating;
  }

  /**
   * Suscribe un listener a los eventos generados.
   */
  onEvent(callback: (event: OfficeEvent) => void): () => void {
    this.on("event", callback);
    return () => this.off("event", callback);
  }
}
