// view.js

import {
  fetchFilterFeatureOfInterest,
  drawPointFeaturesOnMap,
  groupByStation,
  parseViewParams
} from "./view-utils.js";

import {
  createJsonModal,
  createChartModal
} from "./view-modals.js";

import {
  renderResultsTableWRF_ROMS,
  renderResultsTableCTD
} from "./view-render.js";

import { initLeafletMap } from "./view-init-map.js";

// Extraemos los parámetros de la URL
const { procedure, startDate, endDate, featureTypeName } = parseViewParams();

// Mapea featureTypeName al layer WFS correcto
const wfsLayerMap = {
  'ctd_intecmar.estacion':             'ccmm:observacion_ctd_wfs',
  'wrf_meteogalicia.grid_modelo_wrf':  'ccmm:prediccion_diaria_wrf_wfs',
  'roms_meteogalicia.grid_modelo_roms':'ccmm:prediccion_diaria_roms_wfs'
};
const wfsTypeName = wfsLayerMap[featureTypeName];

/**
 * Oculta mapa y filtro de procedure si no estamos en CTD.
 */
function configureFilters() {
  if (featureTypeName !== 'ctd_intecmar.estacion') {
    const mapF = document.getElementById('mapFilter');
    const procF = document.getElementById('procedureFilter');
    if (mapF)  mapF.style.display  = 'none';
    if (procF) procF.style.display = 'none';
  }
}

/**
 * Ajusta el <h1> según el modelo: CTD, WRF o ROMS.
 */
function setPageTitle() {
  const titles = {
    'ctd_intecmar.estacion': 'CTD Viewer',
    'wrf_meteogalicia.grid_modelo_wrf':     'WRF Viewer',
    'roms_meteogalicia.grid_modelo_roms':   'ROMS Viewer'
  };
  document.getElementById('pageTitle').textContent = titles[featureTypeName];
}

// Inicialización de modales
createJsonModal();
createChartModal();

/**
 * Punto de entrada principal.
 * - Lee parámetros de la URL (procedure, fechas, featureTypeName).
 * - Inicializa el mapa Leaflet con herramientas de dibujo de BBox.
 * - Carga y dibuja las features iniciales.
 * - Configura el handler de búsqueda y renderizado de resultados.
 */
document.addEventListener("DOMContentLoaded", async () => {

  // 1. Configurar título de la página y los filtros
  setPageTitle();
  configureFilters();

  // 2. Rellenar los inputs del formulario con los valores obtenidos
  document.getElementById("procedure").value = procedure;
  document.getElementById("startDate").value = startDate;
  document.getElementById("endDate").value   = endDate;

  // 3. Inicializar mapa con módulo externo
  const { map, drawnItems } = initLeafletMap("map");

  // 4. Inicializar las coordenadas del BBox
  const coordsDiv = document.getElementById("bbox-coordinates");
  const emptyHTML = `
    <span class="coordinate-label">Coordenadas del BBox:</span><br>
    <span class="coordinate-label">SW:</span><br>
    <span class="coordinate-label">NE:</span>
  `;
  coordsDiv.innerHTML = emptyHTML;

  // Listeners para actualizar coordenadas BBox
  map.on("draw:created", e => {
    drawnItems.clearLayers();
    drawnItems.addLayer(e.layer);
    const b = e.layer.getBounds();
    coordsDiv.innerHTML = `
      <span class="coordinate-label">Coordenadas del BBox:</span><br>
      <span class="coordinate-label">SW:</span> ${b.getSouthWest().lat.toFixed(6)} ${b.getSouthWest().lng.toFixed(6)}<br>
      <span class="coordinate-label">NE:</span> ${b.getNorthEast().lat.toFixed(6)} ${b.getNorthEast().lng.toFixed(6)}
    `;
  });
  map.on("draw:deleted", () => coordsDiv.innerHTML = emptyHTML);

  // 5. Cargar y dibujar marcadores iniciales sin filtro de geometría
  try {
    const features = await fetchFilterFeatureOfInterest(featureTypeName);
    drawPointFeaturesOnMap(map, features);
  } catch (err) {
    console.error("Error al cargar features:", err);
  }

  // 6. Configurar el botón de búsqueda para consultar Geoserver y mostrar resultados
  const resultsDiv = document.getElementById("resultsList");
  document.getElementById("searchBtn").addEventListener("click", async () => {
    const counterSpan = document.getElementById("resultsCounter");

    // Estado "cargando"
    resultsDiv.innerHTML = "Cargando…";
    counterSpan.textContent = "Resultados mostrados: 0 Resultados encontrados: 0";

    // Recoger filtros de tiempo
    const startVal = document.getElementById("startDate").value;
    const endVal   = document.getElementById("endDate").value;

    const params = new URLSearchParams({ typeName: wfsTypeName });
    if (startVal) params.append("startTime", new Date(startVal).toISOString());
    if (endVal)   params.append("endTime",   new Date(endVal).toISOString());

    // Para CTD, añadimos también procedure y bbox
    if (featureTypeName === "ctd_intecmar.estacion") {
      const procedureVal = document.getElementById("procedure").value;
      if (procedureVal) params.append("procedure", procedureVal);

      const bboxLayer = drawnItems.getLayers()[0];
      if (bboxLayer) {
        const b = bboxLayer.getBounds();
        params.append("bbox",
          `${b.getSouthWest().lng},${b.getSouthWest().lat},` +
          `${b.getNorthEast().lng},${b.getNorthEast().lat}`
        );
      }
    }

    // Realizar fetch y procesar respuesta
    try {
      const resp = await fetch(`/api/geoserver-data?${params.toString()}`);

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = await resp.json();

      // Render según el tipo de feature
      if (featureTypeName !== "ctd_intecmar.estacion") {
        renderResultsTableWRF_ROMS(json, resultsDiv, counterSpan, featureTypeName);
        return;
      }

      const grouped = groupByStation(json.features || []);
      renderResultsTableCTD(grouped, json, resultsDiv, counterSpan);

    } catch (err) {
      resultsDiv.innerHTML    = `<div class="error-msg">Error al consultar Geoserver: ${err.message}</div>`;
      counterSpan.textContent = `Resultados mostrados: 0 Resultados encontrados: 0`;
    }
  });

  // 7. Limpiar resultados al iniciar la página
  resultsDiv.innerHTML = "";
});