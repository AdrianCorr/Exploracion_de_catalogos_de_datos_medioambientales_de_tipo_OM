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
export function drawPointFeaturesOnMap(map, featuresArr) {
  featuresArr.forEach((feat) => {
    const shape = feat.spatialSamplingFeature?.shape;
    if (shape?.type === "Point" && Array.isArray(shape.coordinates)) {
      const [lng, lat] = shape.coordinates;
      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(
          `<strong>${feat.nombre || feat.featureId}</strong><br>` +
          `(${lat.toFixed(6)}, ${lng.toFixed(6)})`
        );
    }
  });
}
