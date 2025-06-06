// public/js/api.js

/**
 * Agrupa todas las funciones que realizan llamadas fetch() a los endpoints de la API.
 * Cada función devuelve un objeto JSON (o lanza un error si resp.ok es false).
 */

/**
 * Fetch a GET /api/process-types?vocabulary=...&searchTerm=...
 */
export async function fetchProcessTypes(vocabulary, searchTerm) {
  // Construimos siempre los dos parámetros: vocabulary y searchTerm (aunque sea cadena vacía)
  const qs = new URLSearchParams();
  qs.append("vocabulary", vocabulary);
  qs.append("searchTerm", searchTerm);

  const url = `/api/process-types?${qs.toString()}`;
  console.log("api.js → fetchProcessTypes llamando a:", url);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}

/**
 * Fetch a GET /api/data-type-by-name?dataTypeName=...
 */
export async function fetchDataTypeByName(name) {
  const resp = await fetch(
    `/api/data-type-by-name?dataTypeName=${encodeURIComponent(name)}`
  );
  if (!resp.ok) {
    throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}

/**
 * Fetch a GET /api/feature-type-by-name?featureTypeName=...
 */
export async function fetchFeatureTypeByName(name) {
  const resp = await fetch(
    `/api/feature-type-by-name?featureTypeName=${encodeURIComponent(name)}`
  );
  if (!resp.ok) {
    throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}

/**
 * Fetch a GET /api/filter-feature-of-interest?featureTypeName=...&keywordFilter=...&geometryFilter=...
 */
export async function fetchFilterFeatureOfInterest(options) {
  const { featureTypeName, keywordFilter, geometryFilter } = options;
  const qs = new URLSearchParams({ featureTypeName });

  if (keywordFilter) qs.append("keywordFilter", keywordFilter);
  if (geometryFilter) qs.append("geometryFilter", geometryFilter);

  const url = `/api/filter-feature-of-interest?${qs.toString()}`;
  console.log("api.js → fetchFilterFeatureOfInterest llamando a:", url);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}