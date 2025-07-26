// view-map-raster.js

/**
 * Devuelve la función parseGeoraster compatible con cualquier build.
 */
export function resolveParseGeoraster() {
  if (typeof window.parseGeoraster === "function") return window.parseGeoraster;
  if (typeof window.georaster === "function") return window.georaster;

  const g = window.georaster;
  if (g && typeof g.parseGeoraster === "function") return g.parseGeoraster;
  if (g && typeof g.parse === "function") return g.parse;

  return null;
}

/**
 * Descarga un raster como ArrayBuffer
 */
export async function fetchRasterData(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`WCS HTTP ${res.status}`);
  return await res.arrayBuffer();
}
