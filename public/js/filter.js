// public/js/filter.js

/**
 * Al cargar la página, leemos el parámetro `processType` de la URL
 * y lo escribimos en el input correspondiente.
 */
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const processType = params.get("processType") || "";
  document.getElementById("processType").value = decodeURIComponent(processType);
});

// public/js/filter.js

/**
 * Función para filtrar procesos según los criterios ingresados.
 * Lanza un Error si falta typeName o si la petición HTTP falla.
 * Devuelve la respuesta JSON de `/api/filter-process`.
 */
async function filterProcesses(typeName, keyword, startTime, endTime) {
  if (!typeName) {
    throw new Error("Por favor, introduzca un nombre de tipo de proceso.");
  }
  let url = `/api/filter-process?processTypeName=${encodeURIComponent(typeName)}`;
  if (keyword)   url += `&keywordFilter=${encodeURIComponent(keyword)}`;
  if (startTime) url += `&startTime=${encodeURIComponent(startTime)}`;
  if (endTime)   url += `&endTime=${encodeURIComponent(endTime)}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }
  return await resp.json();
}
window.filterProcesses = filterProcesses;


/*////////////////////////////////////////////////////////////////////////////////
// Función para filtrar Feature of Interest según los criterios ingresados.
// - featureTypeName: nombre del Feature Type (opcional; si está vacío, devuelve []).
async function filterFeatureOfInterest(featureTypeName) {
  if (!featureTypeName) return [];
  const url = `/api/filter-feature-of-interest?featureTypeName=${encodeURIComponent(featureTypeName)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }
  return await resp.json();
}
window.filterFeatureOfInterest = filterFeatureOfInterest;
*/

/*////////////////////////////////////////////////////////////////////////////////
// Función para filtrar procesos por ID.
// Lee inputs con IDs: processByIdTypeNameInput, processIdInput, timeFilterInput
async function processById() {
  const processByIdTypeNameInput = document.getElementById("processByIdTypeNameInput");
  const processIdInput          = document.getElementById("processIdInput");
  const timeFilterInput         = document.getElementById("timeFilterInput");
  const resultDisplay           = document.getElementById("resultDisplay");

  const processTypeName = processByIdTypeNameInput?.value.trim() || "";
  const processId       = processIdInput?.value.trim() || "";
  const timeFilter      = timeFilterInput?.value.trim() || "";

  if (!processTypeName) {
    if (resultDisplay) resultDisplay.textContent = "Por favor, introduzca un nombre de tipo de proceso.";
    return;
  }

  let url = `/api/process-by-id?processTypeName=${encodeURIComponent(processTypeName)}&id=${encodeURIComponent(processId)}`;
  if (timeFilter) {
    url += `&timeFilter=${encodeURIComponent(timeFilter)}`;
  }

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (resultDisplay) {
      resultDisplay.textContent = JSON.stringify(data, null, 2);
    }
    return data;
  } catch (error) {
    if (resultDisplay) resultDisplay.textContent = `Error: ${error.message}`;
    console.error(error);
    throw error;
  }
}
window.processById = processById;
*/

/*////////////////////////////////////////////////////////////////////////////////
// Función para buscar Feature of Interest por ID.
// Lee inputs con IDs: 'featureTypeNameFOI' y 'fid'
async function featureOfInterestById() {
  const featureTypeNameFOI = document.getElementById("featureTypeNameFOI")?.value.trim() || "";
  const fid                = document.getElementById("fid")?.value.trim() || "";
  const resultDisplay      = document.getElementById("resultDisplay");

  if (!featureTypeNameFOI || !fid) {
    if (resultDisplay) resultDisplay.textContent = "Por favor, introduzca el nombre del Feature Type y su ID.";
    return;
  }

  const url = `/api/feature-of-interest-by-id?featureTypeName=${encodeURIComponent(featureTypeNameFOI)}&fid=${encodeURIComponent(fid)}`;
  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (resultDisplay) {
      resultDisplay.textContent = JSON.stringify(data, null, 2);
    }
    return data;
  } catch (error) {
    if (resultDisplay) resultDisplay.textContent = `Error: ${error.message}`;
    console.error(error);
    throw error;
  }
}
window.featureOfInterestById = featureOfInterestById;
*/

/*////////////////////////////////////////////////////////////////////////////////
// Función para obtener la metadata de un Feature Type (spatialSamplingFeatureType).
async function fetchFeatureType(featureTypeName) {
  if (!featureTypeName) {
    throw new Error("Por favor, introduzca un nombre de Feature Type.");
  }
  const url = `/api/feature-type-by-name?featureTypeName=${encodeURIComponent(featureTypeName)}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}`);
  }
  return await resp.json();
}
window.fetchFeatureType = fetchFeatureType;
*/

/////////////////////////////////////////////////////////////////////////////////
// Ahora la parte que se encarga de capturar el submit de filter.html y mostrar
// los resultados en el propio filtro (en lugar de enviarlos a la ventana padre).

import { renderResults } from "./renderer.js";

/**
 * Función que se ejecuta al enviar el formulario de filtrado en filter.html.
 * Lee los valores de los inputs: #processType, #keywords, #startDate, #endDate,
 * llama a filterProcesses(...) y, si todo va bien, llama a renderResults(data) para
 * poblar #resultDisplay en esta misma página. En caso de error, muestra el mensaje
 * en el div #filterError.
 */
async function enviarFiltro() {
  // Capturamos los elementos del DOM; si no existen, obtendremos 'null'
  const processTypeNameInput = document.getElementById("processType");
  const keywordInput         = document.getElementById("keywords");
  const startDateInput       = document.getElementById("startDate");
  const endDateInput         = document.getElementById("endDate");
  const errorDisplay         = document.getElementById("filterError");
  const resultDisplay        = document.getElementById("resultDisplay");

  // 1) Verificamos que #processType exista, ya que es obligatorio:
  if (!processTypeNameInput) {
    if (errorDisplay) {
      errorDisplay.textContent = "No se encontró el campo 'Process Type' en el formulario.";
    }
    return;
  }

  // 2) Leemos los valores (trim) o "" si el campo opcional no existiera
  const typeName  = processTypeNameInput.value.trim();
  const keyword   = keywordInput?.value.trim() || "";
  const startTime = startDateInput?.value.trim() || "";
  const endTime   = endDateInput?.value.trim() || "";

  // 3) Limpiamos mensajes previos y resultados antiguos
  if (errorDisplay) {
    errorDisplay.textContent = "";
  }
  if (resultDisplay) {
    resultDisplay.innerHTML = "";
  }

  // 4) Validamos que se haya introducido un tipo de proceso
  if (!typeName) {
    if (errorDisplay) {
      errorDisplay.textContent = "Por favor, introduzca un nombre de tipo de proceso.";
    }
    return;
  }

  try {
    // 5) Llamamos a la API de filtrado
    const data = await filterProcesses(typeName, keyword, startTime, endTime);

    // 6) Mostramos los resultados usando renderResults en <div id="resultDisplay">
    renderResults(data);
  } catch (err) {
    // 7) Si ocurre un error (HTTP o validación), lo mostramos
    if (errorDisplay) {
      errorDisplay.textContent = err.message;
    } else {
      alert(`Error al filtrar procesos: ${err.message}`);
    }
  }
}

// Exponemos enviarFiltro para que filter.html lo invoque con onsubmit
window.enviarFiltro = enviarFiltro;
