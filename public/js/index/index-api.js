// public/js/index-api.js

/**
 * Módulo API: funciones para consumir los endpoints del servidor.
 * Cada función devuelve un JSON o lanza un Error si la respuesta HTTP falla.
 */

/**
 * Obtiene los tipos de procesos según vocabulario y término de búsqueda.
 * @param {string} vocabulary  Código de idioma ('es', 'gl', 'en').
 * @param {string} searchTerm  Texto de búsqueda (puede estar vacío).
 * @returns {Promise<Object[]>} Array de objetos con los tipos de proceso.
 * @throws {Error} Si la petición HTTP no es exitosa.
 */
export async function fetchProcessTypes(vocabulary, searchTerm) {
  // Construir query string con parámetros siempre presentes
  const qs = new URLSearchParams();
  qs.append('vocabulary', vocabulary);
  qs.append('searchTerm', searchTerm);

  const url = `/api/process-types?${qs}`;
  console.log('api.js → fetchProcessTypes llamando a:', url);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error HTTP ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}

/**
 * Obtiene un tipo de dato por su nombre.
 * @param {string} name  Nombre del tipo de dato.
 * @returns {Promise<Object[]>} Array con el tipo de dato encontrado.
 * @throws {Error} Si la petición HTTP no es exitosa.
 */
export async function fetchDataTypeByName(name) {
  const url = `/api/data-type-by-name?dataTypeName=${encodeURIComponent(name)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error HTTP ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}

/**
 * Obtiene un tipo de feature por su nombre.
 * @param {string} name  Nombre del tipo de feature.
 * @returns {Promise<Object[]>} Array con el feature type encontrado.
 * @throws {Error} Si la petición HTTP no es exitosa.
 */
export async function fetchFeatureTypeByName(name) {
  const url = `/api/feature-type-by-name?featureTypeName=${encodeURIComponent(name)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error HTTP ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}

/**
 * Filtra features of interest según criterios opcionales.
 * @param {Object} options
 * @param {string} options.featureTypeName  Nombre del tipo de feature.
 * @param {string} [options.keywordFilter]  Filtro de palabra clave.
 * @param {string} [options.geometryFilter] Filtro de geometría (GeoJSON/ WKT).
 * @returns {Promise<Object[]>} Array con las features filtradas.
 * @throws {Error} Si la petición HTTP no es exitosa.
 */
export async function fetchFilterFeatureOfInterest(options) {
  const { featureTypeName, keywordFilter, geometryFilter } = options;
  const qs = new URLSearchParams({ featureTypeName });

  if (keywordFilter)  qs.append('keywordFilter', keywordFilter);
  if (geometryFilter) qs.append('geometryFilter', geometryFilter);

  const url = `/api/filter-feature-of-interest?${qs}`;
  console.log('api.js → fetchFilterFeatureOfInterest llamando a:', url);

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error HTTP ${resp.status}: ${resp.statusText}`);
  }
  return resp.json();
}
