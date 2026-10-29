import { describe, it, expect } from "vitest";
import type { OfficeRoom } from "@office/shared";

describe("Office Layout and Desk geometry calculation", () => {
  const tileSize = 48;

  const mockRooms: OfficeRoom[] = [
    {
      id: "architecture_room",
      name: "Sala de Arquitectura",
      desk_coords: { x: 4, y: 3 },
      assigned_agent: "architect"
    },
    {
      id: "dev_lab",
      name: "Despacho Backend",
      desk_coords: { x: 10, y: 3 },
      assigned_agent: "backend-developer"
    },
    {
      id: "qa_office",
      name: "Mesa de QA & Verificación",
      desk_coords: { x: 7, y: 8 },
      assigned_agent: "qa-engineer"
    }
  ];

  it("calculates correct world coordinates for desks", () => {
    mockRooms.forEach((room) => {
      const worldX = room.desk_coords.x * tileSize;
      const worldY = room.desk_coords.y * tileSize;

      if (room.id === "architecture_room") {
        expect(worldX).toBe(192);
        expect(worldY).toBe(144);
      } else if (room.id === "dev_lab") {
        expect(worldX).toBe(480);
        expect(worldY).toBe(144);
      } else if (room.id === "qa_office") {
        expect(worldX).toBe(336);
        expect(worldY).toBe(384);
      }
    });
  });

  it("calculates seat position and visitor collaboration position correctly", () => {
    const deskX = 4 * tileSize;
    const deskY = 3 * tileSize;

    const seatPos = { x: deskX, y: deskY + 4 };
    const visitorPos = { x: deskX + 48, y: deskY + 12 };

    expect(seatPos.x).toBe(192);
    expect(seatPos.y).toBe(148);

    expect(visitorPos.x).toBe(240);
    expect(visitorPos.y).toBe(156);
  });
});
