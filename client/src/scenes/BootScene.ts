import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create(): void {
    this.generateFloorsAndTiles();
    this.generateWallsAndDividers();
    this.generateFurniture();
    this.generateCharacters();
    this.generateIconsAndBadges();

    // Iniciar la escena principal de la oficina
    this.scene.start("OfficeScene");
    this.scene.start("UIScene");
  }

  /**
   * Helper para crear un CanvasTexture en Phaser con pixel art nítido
   */
  private makeTexture(
    key: string,
    width: number,
    height: number,
    drawFn: (ctx: CanvasRenderingContext2D) => void
  ): Phaser.Textures.CanvasTexture {
    if (this.textures.exists(key)) {
      this.textures.remove(key);
    }
    const canvasTex = this.textures.createCanvas(key, width, height);
    if (!canvasTex) {
      throw new Error(`Failed to create canvas texture: ${key}`);
    }
    const ctx = canvasTex.getContext();
    ctx.imageSmoothingEnabled = false;
    drawFn(ctx);
    canvasTex.refresh();
    return canvasTex;
  }

  /**
   * Texturas de baldosas de suelos y alfombras para oficinas
   */
  private generateFloorsAndTiles(): void {
    const tileSize = 48;

    // 1. Suelo de Parquet de Madera Cálida (Pasillos / Zonas Comunes)
    this.makeTexture("floor_parquet", tileSize, tileSize, (ctx) => {
      ctx.fillStyle = "#8d5b36";
      ctx.fillRect(0, 0, tileSize, tileSize);

      // Tablas de madera
      const plankHeight = 12;
      for (let y = 0; y < tileSize; y += plankHeight) {
        // Línea divisoria horizontal
        ctx.fillStyle = "#633d20";
        ctx.fillRect(0, y, tileSize, 1);

        // Vetas de madera
        ctx.fillStyle = "#9f693e";
        ctx.fillRect(4, y + 2, 20, 2);
        ctx.fillRect(28, y + 6, 16, 2);

        // Línea vertical entre tablas alternas
        const offset = (y / plankHeight) % 2 === 0 ? 24 : 12;
        ctx.fillStyle = "#633d20";
        ctx.fillRect(offset, y, 1, plankHeight);
      }
    });

    // 2. Baldosa moderna de oficina (Gris tecnológico)
    this.makeTexture("floor_tile_hall", tileSize, tileSize, (ctx) => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, tileSize, tileSize);

      // Borde de la baldosa (junta)
      ctx.fillStyle = "#0f172a";
      ctx.strokeRect(0.5, 0.5, tileSize - 1, tileSize - 1);

      // Efecto speckle / micropuntos de terrazo
      ctx.fillStyle = "#334155";
      ctx.fillRect(8, 8, 2, 2);
      ctx.fillRect(24, 18, 2, 2);
      ctx.fillRect(38, 12, 2, 2);
      ctx.fillRect(14, 34, 2, 2);
      ctx.fillRect(34, 38, 2, 2);
    });

    // 3. Alfombra Azul (Sala de Arquitectura)
    this.makeTexture("carpet_blue", tileSize, tileSize, (ctx) => {
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(0, 0, tileSize, tileSize);

      // Borde de costura
      ctx.fillStyle = "#172554";
      ctx.strokeRect(1, 1, tileSize - 2, tileSize - 2);

      // Patrón de tejido cruzado
      ctx.fillStyle = "#2563eb";
      for (let x = 4; x < tileSize; x += 8) {
        for (let y = 4; y < tileSize; y += 8) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    });

    // 4. Alfombra Verde Esmeralda (Despacho Backend)
    this.makeTexture("carpet_green", tileSize, tileSize, (ctx) => {
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(0, 0, tileSize, tileSize);

      ctx.fillStyle = "#022c22";
      ctx.strokeRect(1, 1, tileSize - 2, tileSize - 2);

      ctx.fillStyle = "#059669";
      for (let x = 4; x < tileSize; x += 8) {
        for (let y = 4; y < tileSize; y += 8) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    });

    // 5. Alfombra Púrpura (Mesa de QA & Verificación)
    this.makeTexture("carpet_purple", tileSize, tileSize, (ctx) => {
      ctx.fillStyle = "#4c1d95";
      ctx.fillRect(0, 0, tileSize, tileSize);

      ctx.fillStyle = "#2e1065";
      ctx.strokeRect(1, 1, tileSize - 2, tileSize - 2);

      ctx.fillStyle = "#7c3aed";
      for (let x = 4; x < tileSize; x += 8) {
        for (let y = 4; y < tileSize; y += 8) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    });

    // 6. Alfombra Ámbar (Área común / Descanso)
    this.makeTexture("carpet_amber", tileSize, tileSize, (ctx) => {
      ctx.fillStyle = "#78350f";
      ctx.fillRect(0, 0, tileSize, tileSize);

      ctx.fillStyle = "#451a03";
      ctx.strokeRect(1, 1, tileSize - 2, tileSize - 2);

      ctx.fillStyle = "#d97706";
      for (let x = 4; x < tileSize; x += 8) {
        for (let y = 4; y < tileSize; y += 8) {
          ctx.fillRect(x, y, 2, 2);
        }
      }
    });
  }

  /**
   * Muros, separadores de cristal y puertas
   */
  private generateWallsAndDividers(): void {
    const tileSize = 48;

    // Muro exterior sólido (arriba)
    this.makeTexture("wall_solid_h", tileSize, 24, (ctx) => {
      // Borde superior biselado
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, tileSize, 6);
      // Cara del muro
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 6, tileSize, 18);
      // Rodapié inferior
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 20, tileSize, 4);
      // Reflejos
      ctx.fillStyle = "#475569";
      ctx.fillRect(2, 2, tileSize - 4, 2);
    });

    // Muro vertical
    this.makeTexture("wall_solid_v", 16, tileSize, (ctx) => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 16, tileSize);
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, 4, tileSize);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(14, 0, 2, tileSize);
    });

    // Separador de cristal translúcido horizontal
    this.makeTexture("divider_glass_h", tileSize, 16, (ctx) => {
      // Vidrio translúcido
      ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
      ctx.fillRect(0, 2, tileSize, 10);
      // Marco de aluminio anodizado
      ctx.fillStyle = "#64748b";
      ctx.fillRect(0, 0, tileSize, 2);
      ctx.fillRect(0, 12, tileSize, 4);
      // Destellos del cristal
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.fillRect(8, 4, 12, 1);
      ctx.fillRect(28, 6, 8, 1);
    });

    // Separador de cristal vertical
    this.makeTexture("divider_glass_v", 12, tileSize, (ctx) => {
      ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
      ctx.fillRect(2, 0, 8, tileSize);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(0, 0, 2, tileSize);
      ctx.fillRect(10, 0, 2, tileSize);
    });

    // Felpudo / Puerta de entrada
    this.makeTexture("door_mat", 40, 20, (ctx) => {
      ctx.fillStyle = "#374151";
      ctx.fillRect(0, 0, 40, 20);
      ctx.fillStyle = "#6b7280";
      ctx.strokeRect(1, 1, 38, 18);
      // Líneas estriadas
      ctx.fillStyle = "#1f2937";
      for (let y = 4; y < 18; y += 3) {
        ctx.fillRect(4, y, 32, 1);
      }
    });
  }

  /**
   * Mobiliario detallado (escritorios, monitores, sillas, tazas, plantas)
   */
  private generateFurniture(): void {
    // 1. Escritorio de Oficina en Madera (72x48 px)
    this.makeTexture("desk_wood", 72, 48, (ctx) => {
      // Sombra proyectada
      ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
      ctx.fillRect(2, 6, 70, 42);

      // Tablero principal
      ctx.fillStyle = "#b45309";
      ctx.fillRect(0, 0, 68, 40);

      // Borde de madera oscura
      ctx.fillStyle = "#78350f";
      ctx.strokeRect(0, 0, 68, 40);

      // Bisel de luz superior
      ctx.fillStyle = "#d97706";
      ctx.fillRect(1, 1, 66, 3);

      // Tapete de escritorio de cuero antracita
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(14, 8, 40, 24);
      ctx.fillStyle = "#334155";
      ctx.strokeRect(14, 8, 40, 24);

      // Ranura para cables
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(32, 3, 4, 3);
    });

    // 2. Monitor Apagado / Reposo (IDLE)
    this.makeTexture("monitor_idle", 32, 24, (ctx) => {
      // Base y peana
      ctx.fillStyle = "#475569";
      ctx.fillRect(12, 18, 8, 4);
      ctx.fillRect(14, 14, 4, 4);

      // Marco del monitor
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(2, 2, 28, 14);

      // Pantalla en reposo (azul oscuro tenue con logo de espera)
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(4, 4, 24, 10);

      // Línea de espera sutil
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(12, 8, 8, 2);
    });

    // 3. Monitor con Código Activo (TYPING)
    this.makeTexture("monitor_code", 32, 24, (ctx) => {
      // Base
      ctx.fillStyle = "#475569";
      ctx.fillRect(12, 18, 8, 4);
      ctx.fillRect(14, 14, 4, 4);

      // Marco
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(2, 2, 28, 14);

      // Pantalla activa (negro VSCode)
      ctx.fillStyle = "#090d16";
      ctx.fillRect(4, 4, 24, 10);

      // Líneas de código coloreadas (sintaxis)
      ctx.fillStyle = "#38bdf8"; // azul
      ctx.fillRect(6, 6, 6, 1);
      ctx.fillStyle = "#a855f7"; // morado
      ctx.fillRect(14, 6, 8, 1);

      ctx.fillStyle = "#4ade80"; // verde
      ctx.fillRect(6, 8, 10, 1);
      ctx.fillStyle = "#facc15"; // amarillo
      ctx.fillRect(18, 8, 6, 1);

      ctx.fillStyle = "#f43f5e"; // rojo/rosa
      ctx.fillRect(6, 10, 8, 1);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(16, 10, 8, 1);
    });

    // 4. Silla Ergonómica de Oficina
    this.makeTexture("office_chair", 32, 32, (ctx) => {
      // Ruedas / base 5 puntas
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(10, 24, 12, 3);
      ctx.fillRect(14, 20, 4, 5);

      // Asiento acolchado
      ctx.fillStyle = "#334155";
      ctx.fillRect(6, 14, 20, 8);
      ctx.fillStyle = "#475569";
      ctx.fillRect(7, 15, 18, 3);

      // Respaldo de malla
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(8, 4, 16, 10);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(10, 6, 12, 6);

      // Reposabrazos
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(4, 12, 3, 8);
      ctx.fillRect(25, 12, 3, 8);
    });

    // 5. Taza de Café Humeante
    this.makeTexture("coffee_cup", 16, 16, (ctx) => {
      // Plato
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(2, 12, 12, 2);

      // Taza
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(4, 6, 8, 6);
      // Asa
      ctx.strokeRect(11.5, 7.5, 3, 3);

      // Café caliente
      ctx.fillStyle = "#451a03";
      ctx.fillRect(5, 7, 6, 2);

      // Humo
      ctx.fillStyle = "rgba(226, 232, 240, 0.7)";
      ctx.fillRect(6, 3, 1, 2);
      ctx.fillRect(8, 2, 1, 2);
      ctx.fillRect(10, 3, 1, 2);
    });

    // 6. Planta de Oficina (Monstera en maceta)
    this.makeTexture("potted_plant", 32, 40, (ctx) => {
      // Sombra
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.beginPath();
      ctx.ellipse(16, 36, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Maceta blanca moderna
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.moveTo(8, 24);
      ctx.lineTo(24, 24);
      ctx.lineTo(21, 36);
      ctx.lineTo(11, 36);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(8, 22, 16, 3);

      // Hojas exuberantes
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.ellipse(16, 14, 10, 9, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.ellipse(12, 11, 7, 6, -0.2, 0, Math.PI * 2);
      ctx.ellipse(20, 12, 7, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#4ade80";
      ctx.fillRect(15, 8, 2, 4);
    });

    // 7. Servidor Rack con LEDs parpadeantes
    this.makeTexture("server_rack", 36, 56, (ctx) => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, 36, 56);
      ctx.fillStyle = "#1e293b";
      ctx.strokeRect(1, 1, 34, 54);

      // Unidades U del rack
      for (let y = 6; y < 50; y += 10) {
        ctx.fillStyle = "#111827";
        ctx.fillRect(4, y, 28, 8);
        ctx.fillStyle = "#374151";
        ctx.strokeRect(4, y, 28, 8);

        // LEDs indicadores
        ctx.fillStyle = "#22c55e"; // verde
        ctx.fillRect(6, y + 3, 2, 2);
        ctx.fillStyle = "#38bdf8"; // cyan
        ctx.fillRect(10, y + 3, 2, 2);
        ctx.fillStyle = "#eab308"; // amarillo
        ctx.fillRect(14, y + 3, 2, 2);

        // Rejilla de ventilación
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(18, y + 3, 12, 2);
      }
    });

    // 8. Dispensador de Agua (Water Cooler)
    this.makeTexture("water_cooler", 24, 48, (ctx) => {
      // Botellón azul transparente
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(6, 4, 12, 16);
      ctx.fillStyle = "#bae6fd";
      ctx.fillRect(8, 6, 3, 12);

      // Cuerpo dispensador blanco
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(4, 20, 16, 24);
      ctx.fillStyle = "#e2e8f0";
      ctx.strokeRect(4, 20, 16, 24);

      // Grifo frío y caliente
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(7, 26, 3, 3);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(14, 26, 3, 3);

      // Rejilla recoge-gotas
      ctx.fillStyle = "#64748b";
      ctx.fillRect(6, 32, 12, 2);
    });

    // 9. Sombra universal bajo los personajes
    this.makeTexture("agent_shadow", 32, 14, (ctx) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(16, 7, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Generación de personajes para cada agente con paletas distintivas
   */
  private generateCharacters(): void {
    const palettes: Record<
      string,
      {
        hair: string;
        skin: string;
        shirt: string;
        pants: string;
        accent: string;
      }
    > = {
      avatar_blue: {
        hair: "#1e293b",
        skin: "#fed7aa",
        shirt: "#2563eb", // Azul intenso (Architect)
        pants: "#1e293b",
        accent: "#60a5fa"
      },
      avatar_green: {
        hair: "#78350f",
        skin: "#fde047",
        shirt: "#059669", // Verde esmeralda (Backend)
        pants: "#334155",
        accent: "#34d399"
      },
      avatar_purple: {
        hair: "#581c87",
        skin: "#ffedd5",
        shirt: "#7c3aed", // Púrpura (QA)
        pants: "#111827",
        accent: "#c084fc"
      },
      avatar_gold: {
        hair: "#18181b",
        skin: "#fbcfe8",
        shirt: "#d97706", // Dorado (OpenCode)
        pants: "#27272a",
        accent: "#fbbf24"
      },
      avatar_red: {
        hair: "#312e81",
        skin: "#fef08a",
        shirt: "#dc2626", // Rojo (DevOps/Seguridad)
        pants: "#1e1e24",
        accent: "#f87171"
      }
    };

    const width = 32;
    const height = 48;

    Object.entries(palettes).forEach(([key, p]) => {
      // 1. Estado Sentado (Mirando al frente hacia el monitor)
      this.makeTexture(`${key}_sit`, width, height, (ctx) => {
        // Cabeza
        ctx.fillStyle = p.hair;
        ctx.fillRect(8, 8, 16, 12);
        ctx.fillStyle = p.skin;
        ctx.fillRect(10, 12, 12, 10);

        // Ojos
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(12, 16, 2, 2);
        ctx.fillRect(18, 16, 2, 2);

        // Torso / Camisa
        ctx.fillStyle = p.shirt;
        ctx.fillRect(8, 22, 16, 14);

        // Cuello / Acento
        ctx.fillStyle = p.accent;
        ctx.fillRect(14, 22, 4, 6);

        // Brazos hacia adelante (sobre el escritorio tecleando sutilmente)
        ctx.fillStyle = p.skin;
        ctx.fillRect(6, 26, 4, 8);
        ctx.fillRect(22, 26, 4, 8);

        // Piernas sentadas
        ctx.fillStyle = p.pants;
        ctx.fillRect(8, 36, 16, 8);
      });

      // 2. De pie mirando hacia abajo (Frontal)
      this.makeTexture(`${key}_stand_down`, width, height, (ctx) => {
        // Cabeza y pelo
        ctx.fillStyle = p.hair;
        ctx.fillRect(8, 6, 16, 12);
        ctx.fillStyle = p.skin;
        ctx.fillRect(10, 10, 12, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(12, 14, 2, 2);
        ctx.fillRect(18, 14, 2, 2);

        // Torso
        ctx.fillStyle = p.shirt;
        ctx.fillRect(8, 20, 16, 14);
        ctx.fillStyle = p.accent;
        ctx.fillRect(14, 20, 4, 8);

        // Brazos a los lados
        ctx.fillStyle = p.shirt;
        ctx.fillRect(5, 20, 3, 10);
        ctx.fillRect(24, 20, 3, 10);
        ctx.fillStyle = p.skin;
        ctx.fillRect(5, 30, 3, 4);
        ctx.fillRect(24, 30, 3, 4);

        // Piernas
        ctx.fillStyle = p.pants;
        ctx.fillRect(9, 34, 5, 12);
        ctx.fillRect(18, 34, 5, 12);
        // Zapatos
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(8, 44, 6, 3);
        ctx.fillRect(18, 44, 6, 3);
      });

      // 3. Caminando Abajo: Frame 1
      this.makeTexture(`${key}_walk_down_0`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.fillRect(8, 6, 16, 12);
        ctx.fillStyle = p.skin;
        ctx.fillRect(10, 10, 12, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(12, 14, 2, 2);
        ctx.fillRect(18, 14, 2, 2);

        ctx.fillStyle = p.shirt;
        ctx.fillRect(8, 20, 16, 14);
        ctx.fillStyle = p.accent;
        ctx.fillRect(14, 20, 4, 8);

        // Brazo izquierdo adelante
        ctx.fillStyle = p.skin;
        ctx.fillRect(4, 22, 4, 10);
        ctx.fillRect(24, 18, 4, 10);

        // Pierna izquierda extendida
        ctx.fillStyle = p.pants;
        ctx.fillRect(8, 34, 6, 10);
        ctx.fillRect(18, 34, 6, 13);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(7, 42, 7, 3);
        ctx.fillRect(18, 45, 6, 3);
      });

      // 4. Caminando Abajo: Frame 2
      this.makeTexture(`${key}_walk_down_1`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.fillRect(8, 6, 16, 12);
        ctx.fillStyle = p.skin;
        ctx.fillRect(10, 10, 12, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(12, 14, 2, 2);
        ctx.fillRect(18, 14, 2, 2);

        ctx.fillStyle = p.shirt;
        ctx.fillRect(8, 20, 16, 14);
        ctx.fillStyle = p.accent;
        ctx.fillRect(14, 20, 4, 8);

        // Brazo derecho adelante
        ctx.fillStyle = p.skin;
        ctx.fillRect(4, 18, 4, 10);
        ctx.fillRect(24, 22, 4, 10);

        // Pierna derecha extendida
        ctx.fillStyle = p.pants;
        ctx.fillRect(8, 34, 6, 13);
        ctx.fillRect(18, 34, 6, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(8, 45, 6, 3);
        ctx.fillRect(17, 42, 7, 3);
      });

      // 5. Mirando Arriba (Espaldas)
      this.makeTexture(`${key}_stand_up`, width, height, (ctx) => {
        // Cabello cubre la nuca
        ctx.fillStyle = p.hair;
        ctx.fillRect(8, 6, 16, 14);

        // Espalda
        ctx.fillStyle = p.shirt;
        ctx.fillRect(8, 20, 16, 14);
        // Piernas
        ctx.fillStyle = p.pants;
        ctx.fillRect(9, 34, 5, 12);
        ctx.fillRect(18, 34, 5, 12);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(9, 44, 5, 3);
        ctx.fillRect(18, 44, 5, 3);
      });

      // 6. Caminando Lateral Izquierda
      this.makeTexture(`${key}_walk_left_0`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.fillRect(10, 6, 14, 12);
        ctx.fillStyle = p.skin;
        ctx.fillRect(8, 10, 8, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(8, 14, 2, 2);

        ctx.fillStyle = p.shirt;
        ctx.fillRect(10, 20, 12, 14);
        ctx.fillStyle = p.skin;
        ctx.fillRect(6, 24, 4, 8);

        ctx.fillStyle = p.pants;
        ctx.fillRect(8, 34, 6, 12);
        ctx.fillRect(16, 34, 6, 9);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(6, 44, 7, 3);
        ctx.fillRect(16, 41, 6, 3);
      });

      this.makeTexture(`${key}_walk_left_1`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.fillRect(10, 6, 14, 12);
        ctx.fillStyle = p.skin;
        ctx.fillRect(8, 10, 8, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(8, 14, 2, 2);

        ctx.fillStyle = p.shirt;
        ctx.fillRect(10, 20, 12, 14);
        ctx.fillStyle = p.skin;
        ctx.fillRect(12, 24, 4, 8);

        ctx.fillStyle = p.pants;
        ctx.fillRect(8, 34, 6, 9);
        ctx.fillRect(16, 34, 6, 12);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(7, 41, 6, 3);
        ctx.fillRect(15, 44, 7, 3);
      });

      // 7. Caminando Lateral Derecha
      this.makeTexture(`${key}_walk_right_0`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.fillRect(8, 6, 14, 12);
        ctx.fillStyle = p.skin;
        ctx.fillRect(16, 10, 8, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(22, 14, 2, 2);

        ctx.fillStyle = p.shirt;
        ctx.fillRect(10, 20, 12, 14);
        ctx.fillStyle = p.skin;
        ctx.fillRect(22, 24, 4, 8);

        ctx.fillStyle = p.pants;
        ctx.fillRect(10, 34, 6, 12);
        ctx.fillRect(18, 34, 6, 9);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(11, 44, 7, 3);
        ctx.fillRect(18, 41, 6, 3);
      });

      this.makeTexture(`${key}_walk_right_1`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.fillRect(8, 6, 14, 12);
        ctx.fillStyle = p.skin;
        ctx.fillRect(16, 10, 8, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(22, 14, 2, 2);

        ctx.fillStyle = p.shirt;
        ctx.fillRect(10, 20, 12, 14);
        ctx.fillStyle = p.skin;
        ctx.fillRect(14, 24, 4, 8);

        ctx.fillStyle = p.pants;
        ctx.fillRect(10, 34, 6, 9);
        ctx.fillRect(18, 34, 6, 12);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(10, 41, 6, 3);
        ctx.fillRect(17, 44, 7, 3);
      });

      // 8. Estado Tecleando (TYPING)
      this.makeTexture(`${key}_typing_0`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.fillRect(8, 8, 16, 12);
        ctx.fillStyle = p.skin;
        ctx.fillRect(10, 12, 12, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(12, 16, 2, 2);
        ctx.fillRect(18, 16, 2, 2);

        ctx.fillStyle = p.shirt;
        ctx.fillRect(8, 22, 16, 14);

        // Manos tecleando rápido (mano izquierda levantada)
        ctx.fillStyle = p.skin;
        ctx.fillRect(5, 23, 4, 7);
        ctx.fillRect(23, 27, 4, 7);

        ctx.fillStyle = p.pants;
        ctx.fillRect(8, 36, 16, 8);
      });

      this.makeTexture(`${key}_typing_1`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.fillRect(8, 9, 16, 12); // ligero cabeceo
        ctx.fillStyle = p.skin;
        ctx.fillRect(10, 13, 12, 10);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(12, 17, 2, 2);
        ctx.fillRect(18, 17, 2, 2);

        ctx.fillStyle = p.shirt;
        ctx.fillRect(8, 23, 16, 14);

        // Manos tecleando rápido (mano derecha levantada)
        ctx.fillStyle = p.skin;
        ctx.fillRect(5, 27, 4, 7);
        ctx.fillRect(23, 23, 4, 7);

        ctx.fillStyle = p.pants;
        ctx.fillRect(8, 37, 16, 8);
      });
    });
  }

  /**
   * Iconos flotantes de estado y bocadillos de diálogo
   */
  private generateIconsAndBadges(): void {
    // 1. Icono de Pensamiento (Bombilla / Foco encendido)
    this.makeTexture("icon_bulb", 24, 24, (ctx) => {
      // Resplandor
      ctx.fillStyle = "rgba(250, 204, 21, 0.4)";
      ctx.beginPath();
      ctx.arc(12, 10, 10, 0, Math.PI * 2);
      ctx.fill();

      // Bulbo de cristal amarillo brillante
      ctx.fillStyle = "#facc15";
      ctx.beginPath();
      ctx.arc(12, 9, 6, 0, Math.PI * 2);
      ctx.fill();

      // Filamento
      ctx.fillStyle = "#eab308";
      ctx.fillRect(11, 7, 2, 4);

      // Casquillo de rosca
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(10, 15, 4, 3);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(10.5, 18, 3, 2);
    });

    // 2. Icono de Terminal de Código (TYPING / TOOL_CALLED)
    this.makeTexture("icon_terminal", 28, 18, (ctx) => {
      // Fondo negro de consola
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 28, 18);
      ctx.fillStyle = "#38bdf8";
      ctx.strokeRect(0.5, 0.5, 27, 17);

      // Barra superior con botones de ventana
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(3, 3, 2, 2);
      ctx.fillStyle = "#eab308";
      ctx.fillRect(7, 3, 2, 2);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(11, 3, 2, 2);

      // Prompt verde `>`
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(4, 9, 3, 1);
      ctx.fillRect(6, 10, 2, 1);
      ctx.fillRect(4, 11, 3, 1);

      // Cursor parpadeante
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(10, 9, 5, 3);
    });

    // 3. Flecha / Cola del bocadillo de diálogo
    this.makeTexture("bubble_tail", 16, 12, (ctx) => {
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(16, 0);
      ctx.lineTo(8, 12);
      ctx.closePath();
      ctx.fill();

      // Relleno interior
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(14, 0);
      ctx.lineTo(8, 10);
      ctx.closePath();
      ctx.fill();
    });

    // 4. Placa de Sala de Oficina (Header Plaque)
    this.makeTexture("room_plaque", 160, 28, (ctx) => {
      // Sombra
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.fillRect(2, 2, 158, 26);

      // Fondo oscuro elegante
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 156, 24);

      // Borde dorado sutil
      ctx.fillStyle = "#d97706";
      ctx.strokeRect(0.5, 0.5, 155, 23);

      // Tachuelas metálicas en las 4 esquinas
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(2, 2, 2, 2);
      ctx.fillRect(152, 2, 2, 2);
      ctx.fillRect(2, 20, 2, 2);
      ctx.fillRect(152, 20, 2, 2);
    });
  }
}
