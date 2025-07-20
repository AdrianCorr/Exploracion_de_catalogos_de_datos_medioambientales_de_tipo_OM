// public/js/view/view-utils.js

/**
 * Solicita features de interés al servidor.
 * Si no se proporciona geometryFilter, devuelve todas las features del tipo.
 *
 * @param {string} featureTypeName   Nombre del tipo de feature.
 * @param {string} [geometryFilter]  Filtro de geometría (GeoJSON, WKT).
 * @returns {Promise<Object[]>}      Array de features filtradas.
 * @throws {Error}                  Si la respuesta HTTP no es exitosa.
 */
export async function fetchFilterFeatureOfInterest(featureTypeName, geometryFilter = "") {
  const params = new URLSearchParams({ featureTypeName });
  if (geometryFilter) {
    params.append("geometryFilter", geometryFilter);
  }

  const url = `/api/filter-feature-of-interest?${params}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error HTTP ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}

/**
 * Dibuja en el mapa marcadores para cada feature con coordenadas [lng, lat].
 *
 * @param {L.Map} map           Instancia de Leaflet donde añadir los marcadores.
 * @param {Object[]} features   Array de features, cada una con spatialSamplingFeature.shape.coordinates.
 */
export function drawPointFeaturesOnMap(map, features) {
  // Icono reducido para los marcadores
  const smallIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    iconSize: [16, 26],        // ancho, alto en píxeles
    iconAnchor: [8, 26],        // punto de anclaje en el icono
    shadowSize: [30, 30],
    shadowAnchor: [8, 30]
  });

  features.forEach((feat) => {
    const coords = feat.spatialSamplingFeature?.shape?.coordinates;
    if (Array.isArray(coords) && coords.length === 2) {
      const [lng, lat] = coords;
      L.marker([lat, lng], { icon: smallIcon })
        .addTo(map)
        .bindPopup(
          `<strong>${feat.nombre || feat.codigo || "Estación"}</strong><br>ID: ${feat.featureId}`
        );
    }
  });
}
