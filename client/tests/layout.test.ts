import { describe, it, expect } from "vitest";
import type { OfficeRoom } from "@office/shared";
import { cartToIso, getIsoDepth } from "../src/utils/isoMath.js";

describe("Isometric Office Layout & Geometry (SPEC-006)", () => {
  const mockRooms: OfficeRoom[] = [
    {
      id: "architecture_room",
      name: "Sala de Arquitectura",
      desk_coords: { x: -5, y: 0 },
      assigned_agent: "architect"
    },
    {
      id: "dev_lab",
      name: "Despacho Backend",
      desk_coords: { x: 0, y: -5 },
      assigned_agent: "backend-developer"
    },
    {
      id: "qa_office",
      name: "Mesa de QA & Verificación",
      desk_coords: { x: 5, y: 0 },
      assigned_agent: "qa-engineer"
    }
  ];

  it("calcula coordenadas isométricas de pantalla para los despachos periféricos", () => {
    mockRooms.forEach((room) => {
      const iso = cartToIso(room.desk_coords.x, room.desk_coords.y);

      if (room.id === "architecture_room") {
        // x: -5, y: 0 -> isoX: (-5 - 0) * 32 = -160, isoY: (-5 + 0) * 16 = -80
        expect(iso.isoX).toBe(-160);
        expect(iso.isoY).toBe(-80);
      } else if (room.id === "dev_lab") {
        // x: 0, y: -5 -> isoX: (0 - (-5)) * 32 = 160, isoY: (0 + (-5)) * 16 = -80
        expect(iso.isoX).toBe(160);
        expect(iso.isoY).toBe(-80);
      } else if (room.id === "qa_office") {
        // x: 5, y: 0 -> isoX: (5 - 0) * 32 = 160, isoY: (5 + 0) * 16 = 80
        expect(iso.isoX).toBe(160);
        expect(iso.isoY).toBe(80);
      }
    });
  });

  it("calcula el Hub Central exactamente en el origen (0, 0)", () => {
    const hubCenter = cartToIso(0, 0);
    expect(hubCenter.isoX).toBe(0);
    expect(hubCenter.isoY).toBe(0);

    const tableDepth = getIsoDepth(hubCenter.isoY, 0, 10);
    expect(tableDepth).toBe(10);
  });

  it("calcula la posición del asiento y visitante en perspectiva 2.5D", () => {
    const deskIso = cartToIso(-5, 0); // Architect desk

    const seatPos = { x: deskIso.x, y: deskIso.y + 2 };
    const visitorPos = { x: deskIso.x + 32, y: deskIso.y + 16 };

    expect(seatPos.x).toBe(-160);
    expect(seatPos.y).toBe(-78);

    expect(visitorPos.x).toBe(-128);
    expect(visitorPos.y).toBe(-64);
  });

  it("ordena por profundidad isométrica (Z-sorting) entidades en primer plano", () => {
    const backDesk = cartToIso(0, -5); // Backend (norte / fondo)
    const frontDesk = cartToIso(5, 0); // QA (este / frente)

    const backDepth = getIsoDepth(backDesk.isoY, 0, 10);
    const frontDepth = getIsoDepth(frontDesk.isoY, 0, 10);

    expect(frontDepth).toBeGreaterThan(backDepth);
  });
});
