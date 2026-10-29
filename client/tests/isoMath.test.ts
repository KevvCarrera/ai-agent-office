import { describe, it, expect } from "vitest";
import {
  cartToIso,
  cartesianToIso,
  isoToCart,
  getIsoDepth,
  isoDistance,
  DEFAULT_TILE_WIDTH,
  DEFAULT_TILE_HEIGHT
} from "../src/utils/isoMath.js";

describe("Isometric Math & Projections (isoMath)", () => {
  it("proyecta coordenadas cartesianas a isométricas correctamente", () => {
    // Origen (0, 0) -> (0, 0)
    const origin = cartToIso(0, 0);
    expect(origin.isoX).toBe(0);
    expect(origin.isoY).toBe(0);
    expect(origin.x).toBe(0);
    expect(origin.y).toBe(0);

    // (1, 0) -> (32, 16)
    const p10 = cartToIso(1, 0);
    expect(p10.isoX).toBe(32);
    expect(p10.isoY).toBe(16);

    // (0, 1) -> (-32, 16)
    const p01 = cartToIso(0, 1);
    expect(p01.isoX).toBe(-32);
    expect(p01.isoY).toBe(16);

    // (2, 2) -> (0, 64)
    const p22 = cartToIso(2, 2);
    expect(p22.isoX).toBe(0);
    expect(p22.isoY).toBe(64);

    // Verifica que cartesianToIso sea alias idéntico
    expect(cartesianToIso(3, -2)).toEqual(cartToIso(3, -2));
  });

  it("convierte coordenadas isométricas inversas a cartesianas con precisión", () => {
    const origCart = { x: 5, y: -3 };
    const iso = cartToIso(origCart.x, origCart.y);
    const roundTrip = isoToCart(iso.isoX, iso.isoY);

    expect(roundTrip.cartX).toBeCloseTo(origCart.x, 5);
    expect(roundTrip.cartY).toBeCloseTo(origCart.y, 5);
    expect(roundTrip.x).toBeCloseTo(origCart.x, 5);
    expect(roundTrip.y).toBeCloseTo(origCart.y, 5);
  });

  it("admite tamaños de tile personalizados", () => {
    const customW = 128;
    const customH = 64;
    const iso = cartToIso(2, 1, customW, customH);

    // isoX = (2 - 1) * 64 = 64
    // isoY = (2 + 1) * 32 = 96
    expect(iso.isoX).toBe(64);
    expect(iso.isoY).toBe(96);

    const cart = isoToCart(iso.isoX, iso.isoY, customW, customH);
    expect(cart.cartX).toBeCloseTo(2, 5);
    expect(cart.cartY).toBeCloseTo(1, 5);
  });

  it("calcula profundidad de renderizado dinámico (Z-sorting)", () => {
    // Entidades con mayor isoY tienen mayor profundidad
    const depthBack = getIsoDepth(-50, 0, 10);
    const depthFront = getIsoDepth(100, 0, 10);
    expect(depthFront).toBeGreaterThan(depthBack);

    // Elevación incrementa la profundidad en pasos de 100
    const depthElevated = getIsoDepth(50, 2, 5);
    const depthGround = getIsoDepth(50, 0, 5);
    expect(depthElevated).toBe(depthGround + 200);
  });

  it("calcula distancias euclidianas entre puntos isométricos", () => {
    const dist = isoDistance({ x: 0, y: 0 }, { x: 30, y: 40 });
    expect(dist).toBe(50);
  });
});
