# SPEC-006: Rediseño Isométrico 2.5D — Silicon Valley Tech Loft & Hub Central

- **Estado:** COMPLETADO / APROBADO (LGTM)
- **Responsables:**
  - **Orchestrator:** Especificación técnica e integración.
  - **Developer:** Reescritura del motor isométrico 2.5D, texturas, entidades y HUD.
  - **Reviewer:** Auditoría de proyección isométrica, rendimiento canvas y experiencia visual.

---

## 1. Visión y Objetivos del Rediseño

Sustituir la cuadrícula plana y ortogonal ("cuadrada") actual por una experiencia visual moderna, inmersiva y tridimensional:
* **Perspectiva:** Isométrica 2.5D (proyección matemática clásica $x_{iso} = (x - y) \cdot \cos(30^\circ)$, $y_{iso} = (x + y) \cdot \sin(30^\circ)$ o matriz equivalente $2:1$).
* **Distribución:** **Hub Central de Colaboración** (cafetería lounge, mesa de conferencias y pizarra interactiva) flanqueado por oficinas abiertas en ángulo para cada agente.
* **Estilo Visual:** **Silicon Valley Loft Moderno** (parquet cálido, hormigón pulido, mamparas de cristal translúcido con marcos de acero, monitores curvos ultrawide con reflejos de código y vegetación interior).
* **Mecánica Híbrida de Colaboración:**
  - Desplazamiento directo al escritorio para avisos y consultas rápidas.
  - Convocatoria al Hub Central (mesa de reuniones) para revisiones de código y entregas de arquitectura.
* **UI Glassmorphism:** HUD flotante minimalista con efecto de cristal translúcido y acentos de color según el proveedor de IA (Claude ámbar, Gemini cian, OpenCode esmeralda).

---

## 2. Arquitectura de Coordenadas y Proyección Isométrica 2.5D

```typescript
export interface IsoPoint {
  x: number;
  y: number;
  z?: number; // Elevación vertical
}

export function cartesianToIso(cartX: number, cartY: number, tileWidth = 64, tileHeight = 32): { isoX: number; isoY: number } {
  return {
    isoX: (cartX - cartY) * (tileWidth / 2),
    isoY: (cartX + cartY) * (tileHeight / 2)
  };
}
```

### Mapa y Zonificación:
* **Zona Central (Hub):** Coordenadas centrales $(0, 0)$ a $(4, 4)$. Mesa de reuniones elíptica/isométrica con 4 sillas, pantalla/pizarra de presentación con diagramas, cafetera con vapor y planta alta.
* **Despacho 1 (Architect / Claude):** Ala izquierda $(-5, 0)$ con escritorio esquinero en ángulo, monitor ultrawide curvo y estantería de libros técnicos.
* **Despacho 2 (Backend / Gemini):** Ala superior $(0, -5)$ con escritorio doble, servidores rack con luces parpadeantes y cafetera personal.
* **Despacho 3 (QA & Testing / OpenCode):** Ala derecha $(5, 0)$ con estación de pruebas, terminales de monitoreo y dianas de testing.

---

## 3. Criterios de Aceptación (Checklist de Reviewer)

- [ ] **AC-1 (Proyección Isométrica 2.5D):** La escena se renderiza en perspectiva isométrica real con suelo de baldosas en rombo/diamante, eliminando la sensación de cuadrícula plana ortogonal.
- [ ] **AC-2 (Hub Central & Despachos en V):** Existe un área central de reuniones claramente diferenciada de los despachos periféricos de cada agente.
- [ ] **AC-3 (Mobiliario 2.5D & Ambición Visual):** Escritorios con perspectiva, monitores curvos con código animado, plantas, sillas de oficina con orientación y sombras proyectadas.
- [ ] **AC-4 (Máquina de Estados & Movimiento Isométrico):** Los personajes se desplazan en trayectoria isométrica natural (diagonales suaves), ordenados por profundidad (`depth = isoY + elevation`).
- [ ] **AC-5 (Colaboración Híbrida):** Eventos de comunicación mueven a los agentes al Hub Central o al escritorio destino con bocadillos de diálogo flotantes adaptados a la perspectiva 2.5D.
- [ ] **AC-6 (HUD Glassmorphism):** Barra superior e inspector con estética moderna translúcida, acentos de color de proveedor y cero firmas `Co-authored-by`.
