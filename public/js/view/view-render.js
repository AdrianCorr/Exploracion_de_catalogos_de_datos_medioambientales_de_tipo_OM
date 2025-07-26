// view-render.js

import { 
  showJsonModal,
  showChartForStation
} from "./view-modals.js";

/**
 * Renderiza la tabla de resultados para WRF/ROMS
 * @param {Array} features Array de GeoJSON features
 * @param {HTMLElement} resultsDiv contenedor de resultados
 * @param {HTMLElement} counterSpan span que muestra el conteo
 * @param {string} featureTypeName nombre del tipo de feature
 */
export function renderResultsTableWRF_ROMS(json, resultsDiv, counterSpan, featureTypeName) {
  const itemsTotal = Number.isInteger(json.totalCount) ? json.totalCount : (json.features || []).length;

  const features = json.features || [];
  const itemsShown = features.length;

  counterSpan.textContent = `Resultados mostrados: ${itemsShown} Resultados encontrados: ${itemsTotal}`;

  if (itemsShown === 0) {
    resultsDiv.innerHTML = `<div>No results found.</div>`;
    return;
  }

  // Construir tabla
  let html = `
   <table class="results-table">
     <thead>
       <tr>
         <th>Name</th>
         <th>Phenomenon Time</th>
         <th>Result Time</th>
         <th>Details</th>
       </tr>
     </thead>
     <tbody>
  `;
  for (const feat of features) {
    const p = feat.properties;
    const name  = p.nombre || p.name || "—";
    const pheno = (p.phenomenon_time_start && p.phenomenon_time_end) ? `[${p.phenomenon_time_start} - ${p.phenomenon_time_end}]` : (p.phenomenon_time || "—");
    const result = p.result_time || "—";
    const dataJson  = JSON.stringify([feat]);
    const dataChart = JSON.stringify([feat]);

    // Generamos el botón correspondiente (Show Chart, WRF Viewer, ROMS Viewer)
    let viewerBtn = `<button onclick='showChartForStation(${dataChart})'>Show Chart</button>`;
    if (featureTypeName === 'wrf_meteogalicia.grid_modelo_wrf') {
      viewerBtn = `
        <button class="results-table--btn"
            onclick="window.open('view-map.html?coverageId=${encodeURIComponent(p.subsamples_coverage)}&featureTypeName=${encodeURIComponent(featureTypeName)}','_blank')">
            WRF Viewer
        </button>`;
    } else if (featureTypeName === 'roms_meteogalicia.grid_modelo_roms') {
        viewerBtn = `
          <button class="results-table--btn"
            onclick="window.open('view-map.html?coverageId=${encodeURIComponent(p.subsamples_coverage)}&featureTypeName=${encodeURIComponent(featureTypeName)}','_blank')">
            ROMS Viewer
          </button>`;
    }

    html += `
      <tr>
        <td>${name}</td>
        <td>${pheno}</td>
        <td>${result}</td>
        <td>
          <button onclick='showJsonModal(${dataJson})'>Show JSON</button>
          ${viewerBtn}
        </td>
      </tr>
    `;
  }
  html += `</tbody></table>`;
  resultsDiv.innerHTML = html;
}

/**
 * Renderiza la tabla de resultados para CTD
 * @param {Object} grouped datos agrupados por estación
 * @param {HTMLElement} resultsDiv contenedor de resultados
 * @param {HTMLElement} counterSpan span que muestra el conteo
 */
export function renderResultsTableCTD(grouped, json, resultsDiv, counterSpan) {
  const itemsTotal = Number.isInteger(json.totalCount) ? json.totalCount : (json.features || []).length;

  const itemsShown = Object.values(grouped).reduce((sum, g) => sum + g.observations.length, 0);

  counterSpan.textContent = `Resultados mostrados: ${itemsShown} Resultados encontrados: ${itemsTotal}`;

  if (itemsShown === 0) {
    resultsDiv.innerHTML = `<div>No results found.</div>`;
    return;
  }

  let html = `
    <table class="results-table">
      <thead>
        <tr>
          <th>Name</th><th>Procedure</th><th>Result time</th>
          <th>Phenomenon Time</th><th>Depth</th><th>Details</th>
        </tr>
      </thead>
      <tbody>
  `;
  for (const [name, grp] of Object.entries(grouped)) {
    const { observations, resultTime, procedure } = grp;
    // Calcular rango de tiempo y profundidad
    const times  = observations.map(o => new Date(o.properties.phenomenon_time).getTime()).filter(Boolean);
    const depths = observations.map(o => parseFloat(o.properties.profundidad)).filter(n => !isNaN(n));
    const pMin   = new Date(Math.min(...times));
    const pMax   = new Date(Math.max(...times));
    const dMin   = Math.min(...depths);
    const dMax   = Math.max(...depths);
    const pRange = `[${pMin.toISOString().slice(0,16).replace("T"," ")}, ${pMax.toISOString().slice(0,16).replace("T"," ")}]`;
    const dRange = `[${dMin}, ${dMax}]`;

    // Crear JSON y Chart data
    const jsonData  = JSON.stringify(observations);
    const chartData = JSON.stringify(observations);

    html += `
      <tr>
        <td>${name}</td>
        <td>${procedure}</td>
        <td>${resultTime || "-"}</td>
        <td>${pRange}</td>
        <td>${dRange}</td>
        <td>
          <button onclick='showJsonModal(${jsonData})'>Show JSON</button>
          <button onclick='showChartForStation(${chartData})'>Show Chart</button>
        </td>
      </tr>
    `;
  }
  html += `</tbody></table>`;
  resultsDiv.innerHTML = html;
}

// Exponer funciones globales
window.showJsonModal = showJsonModal;
window.showChartForStation = showChartForStation;