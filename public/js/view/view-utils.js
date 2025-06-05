// public/js/view/view-utils.js

/**
 * Dado un processTypeName, devuelve el JSON de /api/process-types?vocabulary=&searchTerm=
 * El endpoint devuelve un array de “process metadata”. Cada objeto puede tener
 *   .feature_of_interest_type
 */
export async function fetchProcessTypesByName(processTypeName) {
  // Nota: en tu caso no tienes 'vocabulary', así que lo dejamos vacío.
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
 * Dado un sampledFeatureType (que es string), devuelve el GeoJSON/Polygon
 * contenida en metadata.spatialSamplingFeatureType.geo (o WKT).
 */
export function extractPolygonFromFeatureMeta(featureMeta) {
  // featureMeta = objeto con propiedades como:
  //   { name: "...", class: "...", spatialSamplingFeatureType: { geo: { type:"Polygon", coordinates: [...] }, ... } }
  if (
    featureMeta &&
    featureMeta.spatialSamplingFeatureType &&
    featureMeta.spatialSamplingFeatureType.geo
  ) {
    return featureMeta.spatialSamplingFeatureType.geo;
  }
  return null;
}

/**
 * Dado un featureTypeName y un WKT (o GeoJSON cosechado en extractPolygonFromFeatureMeta),
 * invoca /api/filter-feature-of-interest?featureTypeName=<>&geometryFilter=<WKT>
 * y devuelve el array resultante, que normalmente contiene geometrías con coordenadas.
 */
export async function fetchFilterFeatureOfInterest(featureTypeName, wktPolygon) {
  const qs = new URLSearchParams({ featureTypeName });
  // Si tu WKT necesita encode (espacios, comas...), haz encodeURIComponent:
  qs.append("geometryFilter", wktPolygon);
  const url = `/api/filter-feature-of-interest?${qs.toString()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error al obtener filter-feature-of-interest: HTTP ${resp.status}`);
  }
  return await resp.json();
}

/**
 * Convierte (opcionalmente) un objeto GeoJSON de tipo Polygon en una capa de Leaflet.
 * Por simplicidad, si la respuesta viene en formato GeoJSON “FeatureCollection”, 
 * lo dibujamos.
 */
export function drawGeoJSONOnMap(map, geojsonData) {
  // Asegurémonos de que geojsonData tenga un formato válido:
  try {
    L.geoJSON(geojsonData, {
      style: { color: "#FF0000", weight: 2, fillOpacity: 0.1 }
    }).addTo(map);
  } catch (e) {
    console.error("Error al dibujar GeoJSON:", e);
  }
}
