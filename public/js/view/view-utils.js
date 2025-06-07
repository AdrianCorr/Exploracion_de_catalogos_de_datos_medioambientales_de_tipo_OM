/**
 * Llama a /api/filter-feature-of-interest?featureTypeName=<featureTypeName>
 * Si no se pasa geometryFilter, devuelve **todas** las features de ese tipo.
 */
export async function fetchFilterFeatureOfInterest(featureTypeName, geometryFilter = "") {
  const qs = new URLSearchParams({ featureTypeName });
  if (geometryFilter) qs.append("geometryFilter", geometryFilter);
  const url = `/api/filter-feature-of-interest?${qs.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error al obtener filter-feature-of-interest: HTTP ${resp.status}`);
  }
  return await resp.json();
}

/**
 * Dibuja marcadores en el mapa para cada elemento de 'featuresArr'.
 * Cada feature debe tener: feature.spatialSamplingFeature.shape.coordinates = [lng, lat]
 */
export function drawPointFeaturesOnMap(map, features) {
  // Definimos un icono pequeño:
  const smallIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
    iconRetinaUrl:
      "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
    shadowUrl:
      "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
    iconSize:     [16, 26],  // ancho, alto en píxeles
    iconAnchor:   [8, 26],   // punto del icono que corresponde a la posición geográfica
    shadowSize:   [30, 30],  // puedes ajustarlo o dejar el original
    shadowAnchor: [8, 30]
  });

  features.forEach((feat) => {
    // cada feat tiene .spatialSamplingFeature.shape.coordinates = [lng, lat]
    const coords = feat.spatialSamplingFeature?.shape?.coordinates;
    if (coords && coords.length === 2) {
      const [lng, lat] = coords;
      L.marker([lat, lng], { icon: smallIcon })
        .addTo(map)
        .bindPopup(
          `<strong>${feat.nombre || feat.codigo || "Estación"}</strong><br>` +
          `ID: ${feat.featureId}`
        );
    }
  });
}
