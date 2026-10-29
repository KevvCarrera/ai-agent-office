export interface IsoPoint {
  x: number;
  y: number;
  z?: number;
}

export const DEFAULT_TILE_WIDTH = 64;
export const DEFAULT_TILE_HEIGHT = 32;

/**
 * Convierte coordenadas cartesianas (grid x, y) a coordenadas de pantalla isométrica (isoX, isoY).
 * Proyección 2:1 clásica de diamante:
 * isoX = (x - y) * (tileW / 2)
 * isoY = (x + y) * (tileH / 2)
 */
export function cartToIso(
  x: number,
  y: number,
  tileW: number = DEFAULT_TILE_WIDTH,
  tileH: number = DEFAULT_TILE_HEIGHT
): { x: number; y: number; isoX: number; isoY: number } {
  const isoX = (x - y) * (tileW / 2);
  const isoY = (x + y) * (tileH / 2);
  return { x: isoX, y: isoY, isoX, isoY };
}

// Alias para compatibilidad con SPEC-006
export const cartesianToIso = cartToIso;

/**
 * Convierte coordenadas de pantalla isométrica (isoX, isoY) a coordenadas cartesianas (cartX, cartY).
 * cartX = isoX / tileW + isoY / tileH
 * cartY = isoY / tileH - isoX / tileW
 */
export function isoToCart(
  isoX: number,
  isoY: number,
  tileW: number = DEFAULT_TILE_WIDTH,
  tileH: number = DEFAULT_TILE_HEIGHT
): { x: number; y: number; cartX: number; cartY: number } {
  const cartX = isoX / tileW + isoY / tileH;
  const cartY = isoY / tileH - isoX / tileW;
  return { x: cartX, y: cartY, cartX, cartY };
}

/**
 * Cálculo dinámico de profundidad isométrica (Z-sorting).
 * Permite que entidades con mayor isoY se dibujen al frente, y contempla elevación y offsets.
 */
export function getIsoDepth(
  isoY: number,
  elevation: number = 0,
  zIndexOffset: number = 0
): number {
  return Math.round(isoY + elevation * 100 + zIndexOffset);
}

/**
 * Distancia euclidiana entre dos puntos isométricos en coordenadas de pantalla.
 */
export function isoDistance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}
