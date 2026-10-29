import fs from "node:fs";
import path from "node:path";
import yaml from "yaml";
import type { OfficeConfig, OfficeRoom, AgentMetadata, WatchType } from "@office/shared";

/**
 * Rutas candidatas por defecto para localizar office.config.yaml
 */
const DEFAULT_CANDIDATE_PATHS = [
  "office.config.yaml",
  "../office.config.yaml",
  "../../office.config.yaml"
];

/**
 * Deduce el proveedor a partir del nombre o modelo del agente si no se especifica explícitamente.
 */
export function inferProvider(model: string, watchTarget: string): string {
  const lowerModel = (model || "").toLowerCase();
  const lowerTarget = (watchTarget || "").toLowerCase();

  if (lowerModel.includes("claude") || lowerTarget.includes("claude")) {
    return "Claude";
  }
  if (lowerModel.includes("gemini") || lowerTarget.includes("gemini") || lowerTarget.includes("antigravity")) {
    return "Gemini";
  }
  if (lowerModel.includes("opencode") || lowerTarget.includes("opencode")) {
    return "OpenCode";
  }
  if (lowerModel.includes("ollama") || lowerTarget.includes("ollama")) {
    return "Ollama";
  }
  return "Generic";
}

/**
 * Deduce el WatchType a partir del proveedor, modelo o ruta de archivo si no se especifica.
 */
export function inferWatchType(model: string, watchTarget: string, provider?: string): WatchType {
  const lowerModel = (model || "").toLowerCase();
  const lowerTarget = (watchTarget || "").toLowerCase();
  const lowerProvider = (provider || "").toLowerCase();

  if (lowerModel.includes("claude code") || lowerTarget.includes("claude") || lowerProvider.includes("claude")) {
    return "claude_code";
  }
  if (lowerModel.includes("gemini") || lowerTarget.includes("transcript") || lowerTarget.includes("antigravity") || lowerProvider.includes("gemini")) {
    return "antigravity";
  }
  if (lowerModel.includes("opencode") || lowerTarget.includes("opencode") || lowerProvider.includes("opencode")) {
    return "opencode";
  }
  return "jsonl_stream";
}

/**
 * Encuentra la ruta absoluta a office.config.yaml o lanza un error si no existe.
 */
export function findConfigPath(customPath?: string): string {
  if (customPath) {
    const resolved = path.isAbsolute(customPath) ? customPath : path.resolve(process.cwd(), customPath);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
    throw new Error(`[ConfigLoader] Archivo de configuración no encontrado en la ruta especificada: ${resolved}`);
  }

  if (process.env.OFFICE_CONFIG_PATH) {
    const envPath = path.isAbsolute(process.env.OFFICE_CONFIG_PATH)
      ? process.env.OFFICE_CONFIG_PATH
      : path.resolve(process.cwd(), process.env.OFFICE_CONFIG_PATH);
    if (fs.existsSync(envPath)) {
      return envPath;
    }
  }

  for (const candidate of DEFAULT_CANDIDATE_PATHS) {
    const resolved = path.resolve(process.cwd(), candidate);
    if (fs.existsSync(resolved)) {
      return resolved;
    }
  }

  throw new Error(
    `[ConfigLoader] No se pudo encontrar office.config.yaml en las rutas candidatas: ${DEFAULT_CANDIDATE_PATHS.map((p) => path.resolve(process.cwd(), p)).join(", ")}`
  );
}

/**
 * Valida y normaliza el objeto parseado del YAML asegurando cumplimiento con OfficeConfig.
 */
export function validateConfig(raw: unknown): OfficeConfig {
  if (!raw || typeof raw !== "object") {
    throw new Error("[ConfigLoader] El contenido de configuración no es un objeto válido.");
  }

  const obj = raw as Record<string, unknown>;

  const version = typeof obj.version === "string" && obj.version.trim() ? obj.version.trim() : "1.0";

  const rawSettings = (obj.settings && typeof obj.settings === "object") ? (obj.settings as Record<string, unknown>) : {};
  const settings = {
    refresh_rate_ms: typeof rawSettings.refresh_rate_ms === "number" && rawSettings.refresh_rate_ms > 0 ? rawSettings.refresh_rate_ms : 500,
    websocket_port: typeof rawSettings.websocket_port === "number" && rawSettings.websocket_port > 0 ? rawSettings.websocket_port : 4000,
    http_port: typeof rawSettings.http_port === "number" && rawSettings.http_port > 0 ? rawSettings.http_port : 3000
  };

  if (!Array.isArray(obj.offices)) {
    throw new Error("[ConfigLoader] 'offices' debe ser un array definido en office.config.yaml");
  }

  const offices: OfficeRoom[] = obj.offices.map((rawOffice, index) => {
    if (!rawOffice || typeof rawOffice !== "object") {
      throw new Error(`[ConfigLoader] Oficina en el índice ${index} no es un objeto válido.`);
    }
    const o = rawOffice as Record<string, unknown>;
    if (!o.id || typeof o.id !== "string") {
      throw new Error(`[ConfigLoader] Cada oficina debe tener un 'id' string (índice ${index}).`);
    }
    if (!o.name || typeof o.name !== "string") {
      throw new Error(`[ConfigLoader] Oficina '${o.id}' requiere un campo 'name' string.`);
    }
    const coords = (o.desk_coords && typeof o.desk_coords === "object") ? (o.desk_coords as Record<string, unknown>) : null;
    if (!coords || typeof coords.x !== "number" || typeof coords.y !== "number") {
      throw new Error(`[ConfigLoader] Oficina '${o.id}' requiere 'desk_coords' válidas con x e y numéricas.`);
    }
    if (!o.assigned_agent || typeof o.assigned_agent !== "string") {
      throw new Error(`[ConfigLoader] Oficina '${o.id}' requiere un 'assigned_agent' string.`);
    }

    return {
      id: o.id,
      name: o.name,
      desk_coords: { x: coords.x, y: coords.y },
      assigned_agent: o.assigned_agent
    };
  });

  if (!Array.isArray(obj.agents)) {
    throw new Error("[ConfigLoader] 'agents' debe ser un array definido en office.config.yaml");
  }

  const agents: AgentMetadata[] = obj.agents.map((rawAgent, index) => {
    if (!rawAgent || typeof rawAgent !== "object") {
      throw new Error(`[ConfigLoader] Agente en el índice ${index} no es un objeto válido.`);
    }
    const a = rawAgent as Record<string, unknown>;
    if (!a.id || typeof a.id !== "string") {
      throw new Error(`[ConfigLoader] Cada agente debe tener un 'id' string (índice ${index}).`);
    }
    if (!a.name || typeof a.name !== "string") {
      throw new Error(`[ConfigLoader] Agente '${a.id}' requiere un campo 'name' string.`);
    }
    if (!a.model || typeof a.model !== "string") {
      throw new Error(`[ConfigLoader] Agente '${a.id}' requiere un campo 'model' string.`);
    }
    if (!a.sprite || typeof a.sprite !== "string") {
      throw new Error(`[ConfigLoader] Agente '${a.id}' requiere un campo 'sprite' string.`);
    }
    if (!a.watch_target || typeof a.watch_target !== "string") {
      throw new Error(`[ConfigLoader] Agente '${a.id}' requiere un campo 'watch_target' string.`);
    }

    const provider = typeof a.provider === "string" ? a.provider : inferProvider(a.model, a.watch_target);
    const watch_type = typeof a.watch_type === "string"
      ? (a.watch_type as WatchType)
      : inferWatchType(a.model, a.watch_target, provider);

    return {
      id: a.id,
      name: a.name,
      model: a.model,
      sprite: a.sprite,
      watch_target: a.watch_target,
      provider,
      watch_type
    };
  });

  return {
    version,
    settings,
    offices,
    agents
  };
}

/**
 * Carga y valida office.config.yaml desde una ruta personalizada o desde las rutas por defecto.
 */
export function loadOfficeConfig(customPath?: string): OfficeConfig {
  const configPath = findConfigPath(customPath);
  const rawContent = fs.readFileSync(configPath, "utf-8");
  const parsedYaml = yaml.parse(rawContent);
  return validateConfig(parsedYaml);
}
