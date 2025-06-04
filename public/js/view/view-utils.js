/**
 * view-utils.js — Funciones auxiliares para view.html
 *  • coordinatesTemplate: dado SW y NE, devuelve el HTML formateado
 */

export function coordinatesTemplate(
  swLat = "",
  swLng = "",
  neLat = "",
  neLng = ""
) {
  return (
    `<span class="coordinate-label">Coordenadas del BBox:</span><br>` +
    `<span class="coordinate-label">SW:</span> ${swLat} ${swLng}<br>` +
    `<span class="coordinate-label">NE:</span> ${neLat} ${neLng}`
  );
}
