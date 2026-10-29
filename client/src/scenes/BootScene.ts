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

    // Iniciar la escena principal de la oficina y la UI
    this.scene.start("OfficeScene");
    this.scene.start("UIScene");
  }

  /**
   * Helper para crear un CanvasTexture en Phaser con gráficos nítidos
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
    ctx.imageSmoothingEnabled = true;
    drawFn(ctx);
    canvasTex.refresh();
    return canvasTex;
  }

  /**
   * Dibuja un rombo isométrico base 2:1 dentro de un rectángulo
   */
  private drawIsoDiamond(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    fillStyle: string | CanvasGradient,
    strokeStyle?: string,
    strokeWidth = 1
  ): void {
    const halfW = w / 2;
    const halfH = h / 2;

    ctx.beginPath();
    ctx.moveTo(halfW, 0);
    ctx.lineTo(w, halfH);
    ctx.lineTo(halfW, h);
    ctx.lineTo(0, halfH);
    ctx.closePath();

    ctx.fillStyle = fillStyle;
    ctx.fill();

    if (strokeStyle) {
      ctx.lineWidth = strokeWidth;
      ctx.strokeStyle = strokeStyle;
      ctx.stroke();
    }
  }

  /**
   * 1. Baldosas de suelo en diamante: parquet cálido, hormigón pulido y alfombras
   */
  private generateFloorsAndTiles(): void {
    const tileW = 64;
    const tileH = 32;

    // 1. Parquet Cálido de Madera en Diamante (Zonas de loft / abiertas)
    this.makeTexture("iso_floor_parquet", tileW, tileH, (ctx) => {
      // Fondo base de madera
      this.drawIsoDiamond(ctx, tileW, tileH, "#8d5b36", "#5a361c", 1);

      // Líneas de tablas en ángulo isométrico
      ctx.strokeStyle = "rgba(74, 43, 20, 0.6)";
      ctx.lineWidth = 1;

      // Tablas diagonales paralelas a los ejes isométricos
      ctx.beginPath();
      ctx.moveTo(16, 8);
      ctx.lineTo(48, 24);
      ctx.moveTo(48, 8);
      ctx.lineTo(16, 24);
      ctx.stroke();

      // Vetas de madera sutiles y reflejo cálido
      ctx.fillStyle = "rgba(180, 83, 9, 0.25)";
      ctx.beginPath();
      ctx.moveTo(32, 2);
      ctx.lineTo(44, 8);
      ctx.lineTo(32, 14);
      ctx.lineTo(20, 8);
      ctx.closePath();
      ctx.fill();
    });

    // 2. Hormigón Pulido Gris Tecnológico (Pasillos y vías de circulación)
    this.makeTexture("iso_floor_concrete", tileW, tileH, (ctx) => {
      // Base slate grey
      this.drawIsoDiamond(ctx, tileW, tileH, "#1e293b", "#0f172a", 1);

      // Bisel de luz tenue en borde superior izquierdo
      ctx.strokeStyle = "rgba(71, 85, 105, 0.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, tileH / 2);
      ctx.lineTo(tileW / 2, 0);
      ctx.lineTo(tileW, tileH / 2);
      ctx.stroke();

      // Micropuntos de terrazo
      ctx.fillStyle = "#334155";
      ctx.fillRect(18, 12, 2, 2);
      ctx.fillRect(42, 10, 2, 2);
      ctx.fillRect(28, 20, 2, 2);
      ctx.fillRect(36, 22, 2, 2);
    });

    // 3. Alfombra Hub Central (Mesa de Reuniones / Lounge Central)
    this.makeTexture("iso_carpet_hub", tileW, tileH, (ctx) => {
      // Fondo azul oscuro profundo
      this.drawIsoDiamond(ctx, tileW, tileH, "#0f172a", "#1e293b", 1);

      // Marco interior con resplandor cian
      ctx.save();
      ctx.translate(tileW / 2, tileH / 2);
      ctx.scale(0.8, 0.8);
      ctx.translate(-tileW / 2, -tileH / 2);
      this.drawIsoDiamond(ctx, tileW, tileH, "rgba(56, 189, 248, 0.08)", "rgba(56, 189, 248, 0.4)", 1.5);
      ctx.restore();

      // Detalle de costura cruzada central
      ctx.fillStyle = "rgba(56, 189, 248, 0.3)";
      ctx.fillRect(tileW / 2 - 2, tileH / 2 - 2, 4, 4);
    });

    // 4. Alfombra Ámbar (Ala Arquitecto / Claude)
    this.makeTexture("iso_carpet_amber", tileW, tileH, (ctx) => {
      this.drawIsoDiamond(ctx, tileW, tileH, "#451a03", "#78350f", 1);

      ctx.save();
      ctx.translate(tileW / 2, tileH / 2);
      ctx.scale(0.78, 0.78);
      ctx.translate(-tileW / 2, -tileH / 2);
      this.drawIsoDiamond(ctx, tileW, tileH, "rgba(217, 119, 6, 0.15)", "rgba(245, 158, 11, 0.5)", 1);
      ctx.restore();
    });

    // 5. Alfombra Cian / Azul (Ala Backend / Gemini)
    this.makeTexture("iso_carpet_cyan", tileW, tileH, (ctx) => {
      this.drawIsoDiamond(ctx, tileW, tileH, "#042f2e", "#0f766e", 1);

      ctx.save();
      ctx.translate(tileW / 2, tileH / 2);
      ctx.scale(0.78, 0.78);
      ctx.translate(-tileW / 2, -tileH / 2);
      this.drawIsoDiamond(ctx, tileW, tileH, "rgba(20, 184, 166, 0.15)", "rgba(45, 212, 191, 0.5)", 1);
      ctx.restore();
    });

    // 6. Alfombra Esmeralda / Púrpura (Ala QA / OpenCode)
    this.makeTexture("iso_carpet_emerald", tileW, tileH, (ctx) => {
      this.drawIsoDiamond(ctx, tileW, tileH, "#022c22", "#065f46", 1);

      ctx.save();
      ctx.translate(tileW / 2, tileH / 2);
      ctx.scale(0.78, 0.78);
      ctx.translate(-tileW / 2, -tileH / 2);
      this.drawIsoDiamond(ctx, tileW, tileH, "rgba(16, 185, 129, 0.15)", "rgba(52, 211, 153, 0.5)", 1);
      ctx.restore();
    });

    // Fallbacks para compatibilidad con entidades previas si las invocan
    this.makeTexture("floor_parquet", tileW, tileH, (ctx) => {
      this.drawIsoDiamond(ctx, tileW, tileH, "#8d5b36", "#5a361c");
    });
    this.makeTexture("floor_tile_hall", tileW, tileH, (ctx) => {
      this.drawIsoDiamond(ctx, tileW, tileH, "#1e293b", "#0f172a");
    });
    this.makeTexture("carpet_blue", tileW, tileH, (ctx) => {
      this.drawIsoDiamond(ctx, tileW, tileH, "#042f2e", "#0f766e");
    });
    this.makeTexture("carpet_green", tileW, tileH, (ctx) => {
      this.drawIsoDiamond(ctx, tileW, tileH, "#022c22", "#065f46");
    });
    this.makeTexture("carpet_purple", tileW, tileH, (ctx) => {
      this.drawIsoDiamond(ctx, tileW, tileH, "#3b0764", "#7c3aed");
    });
    this.makeTexture("carpet_amber", tileW, tileH, (ctx) => {
      this.drawIsoDiamond(ctx, tileW, tileH, "#451a03", "#78350f");
    });
  }

  /**
   * 2. Mamparas divisorias de cristal translúcido en ángulo isométrico y muros
   */
  private generateWallsAndDividers(): void {
    // 1. Mampara de cristal translúcido en ángulo isométrico (Eje X / Derecha-Abajo: 64x44)
    this.makeTexture("iso_glass_divider_right", 64, 44, (ctx) => {
      // Cristal translúcido con tinte azulado
      ctx.fillStyle = "rgba(148, 163, 184, 0.22)";
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(32, 32);
      ctx.lineTo(64, 16);
      ctx.lineTo(64, 4);
      ctx.lineTo(32, 20);
      ctx.lineTo(0, 4);
      ctx.closePath();
      ctx.fill();

      // Marco de aluminio anodizado superior
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(32, 20);
      ctx.lineTo(64, 4);
      ctx.stroke();

      // Marco inferior
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(32, 32);
      ctx.lineTo(64, 16);
      ctx.stroke();

      // Postes verticales de acero
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(0, 16);
      ctx.moveTo(32, 20);
      ctx.lineTo(32, 32);
      ctx.moveTo(64, 4);
      ctx.lineTo(64, 16);
      ctx.stroke();

      // Reflejos diagonales de cristal
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, 8);
      ctx.lineTo(24, 24);
      ctx.moveTo(42, 10);
      ctx.lineTo(54, 20);
      ctx.stroke();
    });

    // 2. Mampara de cristal en ángulo isométrico inverso (Eje Y / Izquierda-Abajo: 64x44)
    this.makeTexture("iso_glass_divider_left", 64, 44, (ctx) => {
      ctx.fillStyle = "rgba(148, 163, 184, 0.22)";
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(32, 0);
      ctx.lineTo(64, 16);
      ctx.lineTo(64, 28);
      ctx.lineTo(32, 12);
      ctx.lineTo(0, 28);
      ctx.closePath();
      ctx.fill();

      // Marco superior
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 16);
      ctx.lineTo(32, 0);
      ctx.lineTo(64, 16);
      ctx.stroke();

      // Marco inferior
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(0, 28);
      ctx.lineTo(32, 12);
      ctx.lineTo(64, 28);
      ctx.stroke();

      // Reflejos diagonales
      ctx.strokeStyle = "rgba(255, 255, 255, 0.65)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(14, 18);
      ctx.lineTo(26, 8);
      ctx.moveTo(38, 14);
      ctx.lineTo(50, 22);
      ctx.stroke();
    });

    // 3. Columna Loft de Acero y Remaches (16x54)
    this.makeTexture("iso_loft_pillar", 16, 54, (ctx) => {
      // Cuerpo columna acero carbón
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 16, 54);

      // Borde de luz
      ctx.fillStyle = "#475569";
      ctx.fillRect(0, 0, 3, 54);

      // Sombra lateral
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(13, 0, 3, 54);

      // Remaches
      ctx.fillStyle = "#94a3b8";
      for (let y = 6; y < 50; y += 12) {
        ctx.fillRect(5, y, 2, 2);
        ctx.fillRect(9, y, 2, 2);
      }

      // Tira LED vertical cian
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(7, 10, 2, 34);
    });

    // Fallbacks
    this.makeTexture("wall_solid_h", 64, 24, (ctx) => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 64, 24);
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, 64, 4);
    });
    this.makeTexture("wall_solid_v", 16, 48, (ctx) => {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, 16, 48);
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, 4, 48);
    });
    this.makeTexture("divider_glass_h", 64, 24, (ctx) => {
      ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
      ctx.fillRect(0, 4, 64, 16);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(0, 0, 64, 3);
      ctx.fillRect(0, 20, 64, 4);
    });
    this.makeTexture("divider_glass_v", 16, 48, (ctx) => {
      ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
      ctx.fillRect(4, 0, 8, 48);
      ctx.fillStyle = "#64748b";
      ctx.fillRect(2, 0, 2, 48);
      ctx.fillRect(12, 0, 2, 48);
    });
    this.makeTexture("door_mat", 48, 24, (ctx) => {
      this.drawIsoDiamond(ctx, 48, 24, "#334155", "#64748b", 1);
    });
  }

  /**
   * 3. Mobiliario en 2.5D: Escritorios esquineros, Monitores ultrawide, Gran mesa ovalada Hub, Pizarra interactiva, etc.
   */
  private generateFurniture(): void {
    // 1. Escritorio Esquinero Isométrico 2.5D (72x48)
    this.makeTexture("iso_desk_wood", 72, 48, (ctx) => {
      // Sombra en el suelo
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(36, 40, 32, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      // Patas de acero cepillado
      ctx.fillStyle = "#64748b";
      ctx.fillRect(10, 22, 3, 18);
      ctx.fillRect(59, 22, 3, 18);
      ctx.fillRect(35, 26, 3, 16);

      // Grosor del tablero (bisel 3D)
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.moveTo(8, 18);
      ctx.lineTo(36, 32);
      ctx.lineTo(64, 18);
      ctx.lineTo(64, 22);
      ctx.lineTo(36, 36);
      ctx.lineTo(8, 22);
      ctx.closePath();
      ctx.fill();

      // Superficie de madera de roble cálido
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.moveTo(8, 18);
      ctx.lineTo(36, 4);
      ctx.lineTo(64, 18);
      ctx.lineTo(36, 32);
      ctx.closePath();
      ctx.fill();

      // Borde pulido de la madera
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tapete de escritorio de cuero antracita en ángulo
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(22, 18);
      ctx.lineTo(36, 11);
      ctx.lineTo(50, 18);
      ctx.lineTo(36, 25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Pasacables metálico
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(36, 9, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 2. Monitor Curvo Ultrawide 34" en Ángulo Isométrico (Reposo / IDLE) (40x32)
    this.makeTexture("iso_monitor_ultrawide_idle", 40, 32, (ctx) => {
      // Base metálica
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.moveTo(14, 26);
      ctx.lineTo(26, 26);
      ctx.lineTo(20, 22);
      ctx.closePath();
      ctx.fill();

      // Soporte articulado
      ctx.fillStyle = "#64748b";
      ctx.fillRect(19, 14, 3, 9);

      // Marco curvo del monitor ultrawide
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.ellipse(20, 11, 18, 9, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Pantalla activa oscura con logo de espera
      ctx.fillStyle = "#090d16";
      ctx.beginPath();
      ctx.ellipse(20, 11, 16, 7.5, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Glow azul suave de reposo
      ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
      ctx.beginPath();
      ctx.arc(20, 11, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Monitor Curvo Ultrawide con Código Activo Brillante (TYPING) (40x32)
    this.makeTexture("iso_monitor_ultrawide_code", 40, 32, (ctx) => {
      // Base y soporte
      ctx.fillStyle = "#475569";
      ctx.beginPath();
      ctx.moveTo(14, 26);
      ctx.lineTo(26, 26);
      ctx.lineTo(20, 22);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#64748b";
      ctx.fillRect(19, 14, 3, 9);

      // Marco curvo
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.ellipse(20, 11, 18, 9, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Pantalla VSCode
      ctx.fillStyle = "#090d16";
      ctx.beginPath();
      ctx.ellipse(20, 11, 16, 7.5, -0.15, 0, Math.PI * 2);
      ctx.fill();

      // Líneas de código coloreadas (sintaxis)
      ctx.fillStyle = "#38bdf8"; // azul
      ctx.fillRect(9, 7, 7, 1);
      ctx.fillStyle = "#c084fc"; // violeta
      ctx.fillRect(17, 7, 5, 1);

      ctx.fillStyle = "#4ade80"; // verde
      ctx.fillRect(8, 9, 10, 1);
      ctx.fillStyle = "#facc15"; // amarillo
      ctx.fillRect(19, 9, 6, 1);

      ctx.fillStyle = "#f43f5e"; // rosa/rojo
      ctx.fillRect(10, 11, 8, 1);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(19, 11, 9, 1);

      ctx.fillStyle = "#34d399";
      ctx.fillRect(11, 13, 11, 1);

      // Resplandor del monitor
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // 4. Gran Mesa Ovalada de Conferencias para el Hub Central (140x70)
    this.makeTexture("iso_meeting_table", 140, 70, (ctx) => {
      // Sombra proyectada
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(70, 50, 60, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Patas cilíndricas de acero cepillado
      ctx.fillStyle = "#475569";
      ctx.fillRect(26, 30, 8, 18);
      ctx.fillRect(106, 30, 8, 18);
      ctx.fillRect(66, 32, 8, 16);

      // Grosor / canto de la mesa (3D bevel)
      ctx.fillStyle = "#3e2723";
      ctx.beginPath();
      ctx.ellipse(70, 31, 56, 21, 0, 0, Math.PI);
      ctx.fill();

      // Superficie elíptica en perspectiva de nogal oscuro
      ctx.fillStyle = "#5d4037";
      ctx.beginPath();
      ctx.ellipse(70, 26, 56, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Borde con bisel cálido
      ctx.strokeStyle = "#8d6e63";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Canaleta central de conexiones tecnológicas (centro de mesa)
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.ellipse(70, 26, 28, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Micrófonos de conferencia / luces de estado LED
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(58, 26, 2, 0, Math.PI * 2);
      ctx.arc(82, 26, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 5. Pizarra / Pantalla Inteligente de Reuniones (Smart Board) - IDLE (72x60)
    this.makeTexture("iso_smartboard_idle", 72, 60, (ctx) => {
      // Base rodante en trípode / peana
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(24, 56);
      ctx.lineTo(48, 56);
      ctx.lineTo(36, 48);
      ctx.closePath();
      ctx.fill();

      // Mástil central
      ctx.fillStyle = "#64748b";
      ctx.fillRect(34, 34, 4, 16);

      // Marco de pantalla ultradelgado
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(8, 4, 56, 34, 4);
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Pantalla en espera con gradiente tecnológico
      const grad = ctx.createLinearGradient(10, 6, 62, 36);
      grad.addColorStop(0, "#090d16");
      grad.addColorStop(1, "#172554");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(10, 6, 52, 30, 2);
      ctx.fill();

      // Texto de standby / logo Hub
      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 6px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("AI AGENT HUB", 36, 17);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "5px system-ui";
      ctx.fillText("STANDBY / READY", 36, 25);
    });

    // 6. Pizarra Inteligente ACTIVA con Diagrama de Arquitectura / Review (72x60)
    this.makeTexture("iso_smartboard_active", 72, 60, (ctx) => {
      // Base y soporte
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.moveTo(24, 56);
      ctx.lineTo(48, 56);
      ctx.lineTo(36, 48);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#64748b";
      ctx.fillRect(34, 34, 4, 16);

      // Marco
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(8, 4, 56, 34, 4);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Pantalla iluminada
      ctx.fillStyle = "#020617";
      ctx.beginPath();
      ctx.roundRect(10, 6, 52, 30, 2);
      ctx.fill();

      // Diagrama de arquitectura interactivo (Nodos y flechas)
      // Nodo 1: Architect (Ámbar)
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.roundRect(14, 10, 10, 7, 2);
      ctx.fill();

      // Nodo 2: Backend (Cian)
      ctx.fillStyle = "#06b6d4";
      ctx.beginPath();
      ctx.roundRect(31, 10, 10, 7, 2);
      ctx.fill();

      // Nodo 3: QA (Verde esmeralda)
      ctx.fillStyle = "#10b981";
      ctx.beginPath();
      ctx.roundRect(48, 10, 10, 7, 2);
      ctx.fill();

      // Flechas conectoras
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(24, 13.5);
      ctx.lineTo(31, 13.5);
      ctx.moveTo(41, 13.5);
      ctx.lineTo(48, 13.5);
      ctx.stroke();

      // Caja de código / entrega abajo
      ctx.fillStyle = "rgba(56, 189, 248, 0.2)";
      ctx.fillRect(14, 21, 44, 12);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 0.8;
      ctx.strokeRect(14, 21, 44, 12);

      ctx.fillStyle = "#4ade80";
      ctx.font = "bold 5px monospace";
      ctx.textAlign = "left";
      ctx.fillText("✓ SPEC REVIEW PASS", 16, 29);
    });

    // 7. Estación de Café Lounge con Cafetera Espresso Italiana (48x44)
    this.makeTexture("iso_coffee_station", 48, 44, (ctx) => {
      // Sombra
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(24, 38, 20, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mueble bar de mármol blanco
      ctx.fillStyle = "#f8fafc";
      ctx.beginPath();
      ctx.roundRect(8, 22, 32, 16, 2);
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Cafetera espresso de acero cromado
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(14, 8, 20, 15);
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(15, 9, 18, 3); // tapa superior

      // Manómetro digital cian
      ctx.fillStyle = "#38bdf8";
      ctx.beginPath();
      ctx.arc(24, 13, 2, 0, Math.PI * 2);
      ctx.fill();

      // Portafiltros y tazas
      ctx.fillStyle = "#334155";
      ctx.fillRect(17, 18, 4, 3);
      ctx.fillRect(27, 18, 4, 3);

      // Vapor sutil
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(19, 6);
      ctx.bezierCurveTo(17, 4, 21, 2, 19, 0);
      ctx.moveTo(29, 6);
      ctx.bezierCurveTo(27, 4, 31, 2, 29, 0);
      ctx.stroke();
    });

    // 8. Servidores Rack 2.5D con LEDs Parpadeantes (36x64)
    this.makeTexture("iso_server_rack", 36, 64, (ctx) => {
      // Sombra
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(18, 60, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Gabinete de acero carbón
      ctx.fillStyle = "#090d16";
      ctx.fillRect(4, 4, 28, 54);
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(4, 4, 28, 54);

      // Puerta de vidrio tintado
      ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
      ctx.fillRect(6, 6, 24, 50);

      // Bandejas de servidores 1U y LEDs
      for (let y = 8; y < 52; y += 9) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(7, y, 22, 7);

        // LEDs indicadores (verde, cian, ámbar)
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(9, y + 2.5, 2, 2);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(13, y + 2.5, 2, 2);
        ctx.fillStyle = "#eab308";
        ctx.fillRect(17, y + 2.5, 2, 2);

        // Rejilla de refrigeración
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(21, y + 2.5, 6, 2);
      }
    });

    // 9. Planta Estilizada Fiddle Leaf Fig (Higuera de hoja de violín) (36x56)
    this.makeTexture("iso_plant_fiddle", 36, 56, (ctx) => {
      // Sombra
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.beginPath();
      ctx.ellipse(18, 52, 14, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Macetero cilíndrico de terracota blanca moderna
      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.roundRect(10, 36, 16, 16, 3);
      ctx.fill();
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Tierra fértil
      ctx.fillStyle = "#3e2723";
      ctx.beginPath();
      ctx.ellipse(18, 38, 7, 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Tallo principal
      ctx.strokeStyle = "#4e342e";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(18, 38);
      ctx.lineTo(18, 14);
      ctx.stroke();

      // Grandes hojas exuberantes
      const drawLeaf = (lx: number, ly: number, angle: number, size: number) => {
        ctx.save();
        ctx.translate(lx, ly);
        ctx.rotate(angle);
        ctx.fillStyle = "#15803d";
        ctx.beginPath();
        ctx.ellipse(0, 0, size, size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22c55e";
        ctx.beginPath();
        ctx.ellipse(-1, -1, size * 0.7, size * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawLeaf(14, 28, -0.4, 9);
      drawLeaf(22, 24, 0.4, 9);
      drawLeaf(13, 18, -0.6, 10);
      drawLeaf(23, 16, 0.5, 10);
      drawLeaf(18, 8, 0, 11);
    });

    // 10. Silla de Oficina Ergonómica Isométrica (32x36)
    this.makeTexture("iso_chair_desk", 32, 36, (ctx) => {
      // Ruedas estrella 5 puntas
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.arc(16, 28, 7, 0, Math.PI * 2);
      ctx.fill();

      // Columna de gas
      ctx.fillStyle = "#64748b";
      ctx.fillRect(15, 20, 2, 8);

      // Asiento acolchado en ángulo
      ctx.fillStyle = "#1e293b";
      ctx.beginPath();
      ctx.ellipse(16, 18, 10, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 0.8;
      ctx.stroke();

      // Respaldo de malla ergonómica
      ctx.fillStyle = "#334155";
      ctx.beginPath();
      ctx.ellipse(16, 9, 8, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(56, 189, 248, 0.4)";
      ctx.fillRect(14, 6, 4, 6);
    });

    // 11. Sombra Universal Suave 2.5D para Entidades (36x18)
    this.makeTexture("iso_agent_shadow", 36, 18, (ctx) => {
      const grad = ctx.createRadialGradient(18, 9, 2, 18, 9, 16);
      grad.addColorStop(0, "rgba(0, 0, 0, 0.45)");
      grad.addColorStop(0.6, "rgba(0, 0, 0, 0.2)");
      grad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.ellipse(18, 9, 16, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Fallbacks para mobiliario plano anterior
    this.makeTexture("desk_wood", 72, 48, (ctx) => {
      ctx.fillStyle = "#b45309";
      ctx.fillRect(0, 0, 72, 48);
    });
    this.makeTexture("monitor_idle", 32, 24, (ctx) => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(2, 2, 28, 14);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(4, 4, 24, 10);
    });
    this.makeTexture("monitor_code", 32, 24, (ctx) => {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(2, 2, 28, 14);
      ctx.fillStyle = "#090d16";
      ctx.fillRect(4, 4, 24, 10);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(6, 6, 8, 2);
    });
    this.makeTexture("office_chair", 32, 32, (ctx) => {
      ctx.fillStyle = "#334155";
      ctx.fillRect(6, 14, 20, 8);
    });
    this.makeTexture("coffee_cup", 16, 16, (ctx) => {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(4, 6, 8, 6);
    });
    this.makeTexture("potted_plant", 32, 40, (ctx) => {
      ctx.fillStyle = "#15803d";
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(10, 26, 12, 10);
    });
    this.makeTexture("server_rack", 36, 56, (ctx) => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, 36, 56);
    });
    this.makeTexture("water_cooler", 24, 48, (ctx) => {
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(6, 4, 12, 16);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(4, 20, 16, 24);
    });
    this.makeTexture("agent_shadow", 32, 14, (ctx) => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
      ctx.beginPath();
      ctx.ellipse(16, 7, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * 4. Sprites de Personajes en Perspectiva Isométrica 2.5D con Poses Orientadas
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
        hair: "#0f172a",
        skin: "#fed7aa",
        shirt: "#2563eb", // Azul / Ámbar (Architect Claude)
        pants: "#1e293b",
        accent: "#f59e0b"
      },
      avatar_green: {
        hair: "#78350f",
        skin: "#fde047",
        shirt: "#0d9488", // Cian / Teal (Backend Gemini)
        pants: "#1e293b",
        accent: "#22d3ee"
      },
      avatar_purple: {
        hair: "#4c1d95",
        skin: "#ffedd5",
        shirt: "#7c3aed", // Púrpura (QA Engineer)
        pants: "#111827",
        accent: "#a855f7"
      },
      avatar_gold: {
        hair: "#18181b",
        skin: "#fbcfe8",
        shirt: "#059669", // Esmeralda / Oro (OpenCode)
        pants: "#1e293b",
        accent: "#10b981"
      }
    };

    const width = 36;
    const height = 52;

    Object.entries(palettes).forEach(([key, p]) => {
      // 1. Sentado en ángulo isométrico frente a monitor (ISO SIT)
      this.makeTexture(`${key}_iso_sit`, width, height, (ctx) => {
        // Cabeza en 3/4
        ctx.fillStyle = p.hair;
        ctx.beginPath();
        ctx.ellipse(18, 12, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.ellipse(19, 14, 6, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Ojos orientados hacia abajo/derecha (al monitor)
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(20, 14, 2, 2);
        ctx.fillRect(23, 14, 2, 2);

        // Torso / Camisa en 3/4
        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.roundRect(11, 22, 14, 15, 3);
        ctx.fill();

        // Acento / Corbata / Bufanda
        ctx.fillStyle = p.accent;
        ctx.fillRect(17, 22, 3, 7);

        // Brazos hacia el escritorio en ángulo
        ctx.fillStyle = p.skin;
        ctx.fillRect(21, 28, 8, 4);

        // Piernas sentadas
        ctx.fillStyle = p.pants;
        ctx.fillRect(12, 37, 13, 8);
      });

      // 2. De pie en 3/4 Isométrico (ISO STAND)
      this.makeTexture(`${key}_iso_stand`, width, height, (ctx) => {
        // Cabeza
        ctx.fillStyle = p.hair;
        ctx.beginPath();
        ctx.ellipse(18, 10, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.ellipse(19, 12, 6, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#0f172a";
        ctx.fillRect(20, 12, 2, 2);
        ctx.fillRect(23, 12, 2, 2);

        // Torso
        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.roundRect(11, 19, 14, 16, 3);
        ctx.fill();

        ctx.fillStyle = p.accent;
        ctx.fillRect(17, 19, 3, 8);

        // Brazos a los lados en ángulo
        ctx.fillStyle = p.shirt;
        ctx.fillRect(8, 20, 3, 10);
        ctx.fillRect(25, 20, 3, 10);
        ctx.fillStyle = p.skin;
        ctx.fillRect(8, 30, 3, 3);
        ctx.fillRect(25, 30, 3, 3);

        // Piernas
        ctx.fillStyle = p.pants;
        ctx.fillRect(12, 35, 5, 12);
        ctx.fillRect(19, 35, 5, 12);

        // Zapatos
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(11, 47, 6, 3);
        ctx.fillRect(19, 47, 6, 3);
      });

      // 3. Caminando en Diagonal Sudeste (SE) - Frame 0 y 1
      this.makeTexture(`${key}_iso_walk_se_0`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.beginPath();
        ctx.ellipse(18, 10, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.ellipse(19, 12, 6, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.roundRect(11, 19, 14, 16, 3);
        ctx.fill();

        // Pierna adelantada
        ctx.fillStyle = p.pants;
        ctx.fillRect(11, 35, 5, 9);
        ctx.fillRect(20, 35, 5, 13);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(10, 44, 6, 3);
        ctx.fillRect(20, 48, 6, 3);
      });

      this.makeTexture(`${key}_iso_walk_se_1`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.beginPath();
        ctx.ellipse(18, 10, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.ellipse(19, 12, 6, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.roundRect(11, 19, 14, 16, 3);
        ctx.fill();

        ctx.fillStyle = p.pants;
        ctx.fillRect(11, 35, 5, 13);
        ctx.fillRect(20, 35, 5, 9);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(11, 48, 6, 3);
        ctx.fillRect(19, 44, 6, 3);
      });

      // 4. Caminando en Diagonal Sudoeste (SW) - Frame 0 y 1
      this.makeTexture(`${key}_iso_walk_sw_0`, width, height, (ctx) => {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        // Dibuja reflejado de SE
        ctx.fillStyle = p.hair;
        ctx.beginPath();
        ctx.ellipse(18, 10, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.ellipse(19, 12, 6, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.roundRect(11, 19, 14, 16, 3);
        ctx.fill();

        ctx.fillStyle = p.pants;
        ctx.fillRect(11, 35, 5, 9);
        ctx.fillRect(20, 35, 5, 13);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(10, 44, 6, 3);
        ctx.fillRect(20, 48, 6, 3);
        ctx.restore();
      });

      this.makeTexture(`${key}_iso_walk_sw_1`, width, height, (ctx) => {
        ctx.save();
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        ctx.fillStyle = p.hair;
        ctx.beginPath();
        ctx.ellipse(18, 10, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.ellipse(19, 12, 6, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.roundRect(11, 19, 14, 16, 3);
        ctx.fill();

        ctx.fillStyle = p.pants;
        ctx.fillRect(11, 35, 5, 13);
        ctx.fillRect(20, 35, 5, 9);
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(11, 48, 6, 3);
        ctx.fillRect(19, 44, 6, 3);
        ctx.restore();
      });

      // 5. Animación de Tecleo Activo (TYPING) en Isométrico
      this.makeTexture(`${key}_iso_typing_0`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.beginPath();
        ctx.ellipse(18, 12, 8, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.ellipse(19, 14, 6, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.roundRect(11, 22, 14, 15, 3);
        ctx.fill();

        // Manos tecleando en diagonal (mano izquierda levantada)
        ctx.fillStyle = p.skin;
        ctx.fillRect(20, 27, 8, 3);
        ctx.fillRect(22, 31, 7, 3);

        ctx.fillStyle = p.pants;
        ctx.fillRect(12, 37, 13, 8);
      });

      this.makeTexture(`${key}_iso_typing_1`, width, height, (ctx) => {
        ctx.fillStyle = p.hair;
        ctx.beginPath();
        ctx.ellipse(18, 13, 8, 8, 0, 0, Math.PI * 2); // ligero cabeceo
        ctx.fill();
        ctx.fillStyle = p.skin;
        ctx.beginPath();
        ctx.ellipse(19, 15, 6, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = p.shirt;
        ctx.beginPath();
        ctx.roundRect(11, 23, 14, 15, 3);
        ctx.fill();

        // Mano derecha levantada
        ctx.fillStyle = p.skin;
        ctx.fillRect(20, 31, 8, 3);
        ctx.fillRect(22, 27, 7, 3);

        ctx.fillStyle = p.pants;
        ctx.fillRect(12, 38, 13, 8);
      });

      // Registrar también claves originales para que cualquier llamada legacy no falle
      this.makeTexture(`${key}_sit`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_stand_down`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_stand_up`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_walk_down_0`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_walk_down_1`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_walk_left_0`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_walk_left_1`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_walk_right_0`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_walk_right_1`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_typing_0`, width, height, (c) => this.drawFallbackAvatar(c, p));
      this.makeTexture(`${key}_typing_1`, width, height, (c) => this.drawFallbackAvatar(c, p));
    });
  }

  private drawFallbackAvatar(
    ctx: CanvasRenderingContext2D,
    p: { hair: string; skin: string; shirt: string; pants: string; accent: string }
  ): void {
    ctx.fillStyle = p.hair;
    ctx.fillRect(10, 6, 16, 12);
    ctx.fillStyle = p.skin;
    ctx.fillRect(12, 10, 12, 10);
    ctx.fillStyle = p.shirt;
    ctx.fillRect(10, 20, 16, 14);
    ctx.fillStyle = p.pants;
    ctx.fillRect(11, 34, 14, 12);
  }

  /**
   * 5. Iconos flotantes y elementos de diálogo 2.5D
   */
  private generateIconsAndBadges(): void {
    // 1. Icono Bombilla con aura luminosa
    this.makeTexture("icon_bulb", 28, 28, (ctx) => {
      // Halo brillante
      const grad = ctx.createRadialGradient(14, 11, 2, 14, 11, 13);
      grad.addColorStop(0, "rgba(250, 204, 21, 0.9)");
      grad.addColorStop(0.5, "rgba(250, 204, 21, 0.3)");
      grad.addColorStop(1, "rgba(250, 204, 21, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(14, 11, 13, 0, Math.PI * 2);
      ctx.fill();

      // Bombilla
      ctx.fillStyle = "#fef08a";
      ctx.beginPath();
      ctx.arc(14, 10, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#eab308";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Casquillo
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(12, 17, 4, 4);
    });

    // 2. Icono Terminal de Código
    this.makeTexture("icon_terminal", 30, 20, (ctx) => {
      ctx.fillStyle = "#090d16";
      ctx.beginPath();
      ctx.roundRect(0, 0, 30, 20, 3);
      ctx.fill();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Botones ventana
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(3, 3, 2, 2);
      ctx.fillStyle = "#eab308";
      ctx.fillRect(7, 3, 2, 2);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(11, 3, 2, 2);

      // Prompt >
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(4, 9, 3, 1);
      ctx.fillRect(6, 10, 2, 1);
      ctx.fillRect(4, 11, 3, 1);

      // Cursor
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(10, 9, 6, 3);
    });

    // 3. Cola del bocadillo de diálogo
    this.makeTexture("bubble_tail", 16, 12, (ctx) => {
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(16, 0);
      ctx.lineTo(8, 12);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
      ctx.beginPath();
      ctx.moveTo(2, 0);
      ctx.lineTo(14, 0);
      ctx.lineTo(8, 10);
      ctx.closePath();
      ctx.fill();
    });

    // 4. Placa identificativa de salas (Glassmorphic)
    this.makeTexture("room_plaque", 160, 28, (ctx) => {
      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.beginPath();
      ctx.roundRect(0, 0, 160, 28, 6);
      ctx.fill();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Puntos decorativos en las esquinas
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(4, 4, 2, 2);
      ctx.fillRect(154, 4, 2, 2);
      ctx.fillRect(4, 22, 2, 2);
      ctx.fillRect(154, 22, 2, 2);
    });
  }
}
