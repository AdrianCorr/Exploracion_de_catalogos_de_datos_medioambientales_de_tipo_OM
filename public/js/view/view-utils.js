/**
 * Dado un processTypeName, devuelve el JSON de /api/process-types?vocabulary=&searchTerm=
 * El endpoint devuelve un array de “process metadata”. Cada objeto puede tener
 *   .feature_of_interest_type
 */
export async function fetchProcessTypesByName(processTypeName) {
  const qs = new URLSearchParams({ vocabulary: "", searchTerm: processTypeName });
  const url = `/api/process-types?${qs.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error al obtener process-types: HTTP ${resp.status}`);
  }
  return await resp.json();
}

/**
 * Dado un featureTypeName, devuelve el array de metadata de /api/feature-type-by-name
 */
export async function fetchFeatureTypeByName(featureTypeName) {
  const url = `/api/feature-type-by-name?featureTypeName=${encodeURIComponent(
    featureTypeName
  )}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error al obtener feature-type-by-name: HTTP ${resp.status}`);
  }
  return await resp.json();
}

/**
 * Dado un featureMeta (objeto retornado por fetchFeatureTypeByName),
 * intenta extraer el valor real de “geo”. Si el metadata tiene un objeto
 * spatialSamplingFeatureType.geo (caso de instancias GeoJSON), lo devuelve directamente.
 * Si no, busca dentro de featureMeta.properties[] la entrada con name === "geo"
 * y devuelve su campo data_type (algo como "Geometry(POLYGON,4326)").
 * Si no encuentra nada, devuelve null.
 */
export function extractPolygonFromFeatureMeta(featureMeta) {
  // Si no, buscamos en properties[] un field "geo"
  if (featureMeta && Array.isArray(featureMeta.properties)) {
    const geoEntry = featureMeta.properties.find((p) => p.name === "geo");
    if (geoEntry && geoEntry.data_type) {
      return geoEntry.data_type; // p.ej. "Geometry(POLYGON,4326)"
    }
  }

  return null;
}

/**
 * Dado un featureTypeName y un WKT (o GeoJSON extraído),
 * invoca /api/filter-feature-of-interest?featureTypeName=<>&geometryFilter=<WKT>
 * y devuelve el array resultante, que normalmente contiene geometrías con coordenadas.
 */
export async function fetchFilterFeatureOfInterest(featureTypeName, wktPolygon) {
  const qs = new URLSearchParams({ featureTypeName });
  qs.append("geometryFilter", wktPolygon);
  const url = `/api/filter-feature-of-interest?${qs.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error al obtener filter-feature-of-interest: HTTP ${resp.status}`);
  }
  return await resp.json();
}

/**
 * Dibuja en el mapa (un L.Map de Leaflet) el geojsonData.
 * Si viene un array de Features o un FeatureCollection, lo añade.
 */
export function drawGeoJSONOnMap(map, geojsonData) {
  try {
    L.geoJSON(geojsonData, {
      style: { color: "#FF0000", weight: 2, fillOpacity: 0.1 }
    }).addTo(map);
  } catch (e) {
    console.error("Error al dibujar GeoJSON:", e);
  }
}
