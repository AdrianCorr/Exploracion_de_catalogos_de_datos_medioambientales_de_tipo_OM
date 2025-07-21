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

/**
 * Extrae los parámetros de la URL para filtrar vistas.
 * Devuelve un objeto con los parámetros:
 * - procedure: Nombre del procedimiento (vacío si no se especifica).
 * - startDate: Fecha de inicio (vacío si no se especifica).
 * - endDate: Fecha de fin (vacío si no se especifica).
 * - featureTypeName: Nombre del tipo de feature (por defecto "ctd_intecmar.estacion").
 */
export function parseViewParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    procedure:      p.get("procedure")       || "",
    startDate:      p.get("startDate")       || "",
    endDate:        p.get("endDate")         || "",
    featureTypeName:p.get("featureTypeName") || "ctd_intecmar.estacion"
  };
}


/**
 * Devuelve un color de la paleta según índice.
 * La paleta tiene hasta 13 colores; cicla si i >= length.
 * @param {number} i Índice de dataset.
 * @returns {string} Color en hex.
 */
export function getColor(i) {
  const colors = [
    "#3366cc","#dc3912","#ff9900","#109618","#990099",
    "#0099c6","#dd4477","#66aa00","#b82e2e","#316395",
    "#994499","#22aa99","#aaaa11"
  ];
  return colors[i % colors.length];
}

/**
 * Agrupa un array de GeoJSON Features por su nombre (propiedad `properties.nombre`),
 * calculando además campos auxiliares (resultTime, procedure).
 * @param {Object[]} features Array de GeoJSON Features
 * @returns {Record<string, { observations: Object[], resultTime: string, procedure: string }>}
 */
export function groupByStation(features) {
  return features.reduce((acc, f) => {
    const { nombre, result_time, procedure } = f.properties;
    const key = nombre || "Sin nombre";
    if (!acc[key]) acc[key] = { observations: [], resultTime: result_time, procedure };
    acc[key].observations.push(f);
    return acc;
  }, {});
}

/**
 * Convierte un array de objetos en un string CSV.
 * Usa la primera fila como cabecera con todas las claves.
 */
export function toCSV(arr) {
  if (!arr.length) return "";
  const keys = Object.keys(arr[0]);
  const lines = [
    keys.join(","), ...arr.map(obj => keys.map(k => {
      const cell = obj[k] != null ? String(obj[k]) : "";
      return `"${cell.replace(/"/g, '""')}"`;
    }).join(","))
  ];
  return lines.join("\r\n");
}
