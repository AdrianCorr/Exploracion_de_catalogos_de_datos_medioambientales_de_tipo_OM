// public/js/filter.js

/**
 * Lee el parámetro `processType` de la URL y lo pone en el input correspondiente.
 */
document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const processType = params.get("processType") || "";
  document.getElementById("processType").value = decodeURIComponent(processType);
});

/**
 * Función para filtrar procesos según los criterios ingresados.
 * Devuelve un array con los procesos filtrados (JSON).
 */
async function filterProcesses(typeName, keyword, startTime, endTime) {
  if (!typeName) {
    throw new Error("Por favor, introduzca un nombre de tipo de proceso.");
  }
  let url = `/api/filter-process?processTypeName=${encodeURIComponent(typeName)}`;
  if (keyword)  url += `&keywordFilter=${encodeURIComponent(keyword)}`;
  if (startTime) url += `&startTime=${encodeURIComponent(startTime)}`;
  if (endTime)   url += `&endTime=${encodeURIComponent(endTime)}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`Error HTTP ${resp.status}: ${resp.statusText}`);
  }
  return await resp.json();
}
// Exponemos también la función en window (por si se quiere usar desde consola)
window.filterProcesses = filterProcesses;

/**
 * Función que se llama cuando el usuario pulsa “Aplicar Filtro”.
 * Lee los valores del formulario y muestra los resultados procesados.
 */
function enviarFiltro() {
  const resultsContainer = document.getElementById("filterResults");
  // Limpiamos cualquier contenido previo
  resultsContainer.innerHTML = "";

  // Leemos los valores del formulario
  const typeName  = document.getElementById("processType").value.trim();
  const keyword   = document.getElementById("keywords").value.trim();
  const startTime = document.getElementById("startDate").value;
  const endTime   = document.getElementById("endDate").value;

  // Llamamos a la función de filtrado en forma asíncrona
  filterProcesses(typeName, keyword, startTime, endTime)
    .then((data) => {
      renderResults(data);
    })
    .catch((err) => {
      const errorMsg = document.createElement("div");
      errorMsg.textContent = `⚠️ ${err.message}`;
      errorMsg.style.color = "var(--secondary-color)";
      errorMsg.style.marginTop = "1rem";
      resultsContainer.appendChild(errorMsg);
    });
}
// Exponemos la función en window para que el inline onsubmit la encuentre
window.enviarFiltro = enviarFiltro;

/**
 * Renderiza la tabla de resultados con filas colapsables para cada medición.
 * data: array de objetos con structure: { processId, processDescription: [ ... ] }
 */
function renderResults(data) {
  const container = document.getElementById("filterResults");
  container.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    const noData = document.createElement("div");
    noData.textContent = "No se encontraron resultados para esos filtros.";
    noData.style.marginTop = "1rem";
    container.appendChild(noData);
    return;
  }

  // Creamos la tabla
  const table = document.createElement("table");
  table.className = "filter-table";
  
  // Thead
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Process ID", "Ship", "Valid Interval"].forEach((colName) => {
    const th = document.createElement("th");
    th.textContent = colName;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Tbody
  const tbody = document.createElement("tbody");

  data.forEach((item) => {
    const processId = item.processId;
    if (!Array.isArray(item.processDescription)) return;

    item.processDescription.forEach((desc) => {
      const barco = desc.barco || "";
      const validInterval = `${formatDate(desc.validTimeStart)} – ${formatDate(desc.validTimeEnd)}`;

      // Fila principal
      const rowMain = document.createElement("tr");
      rowMain.className = "row-main";

      const tdId = document.createElement("td");
      tdId.textContent = processId;
      rowMain.appendChild(tdId);

      const tdShip = document.createElement("td");
      tdShip.textContent = barco;
      rowMain.appendChild(tdShip);

      const tdInterval = document.createElement("td");
      tdInterval.textContent = validInterval;
      rowMain.appendChild(tdInterval);

      // Fila de detalle (inicialmente oculta)
      const rowDetail = document.createElement("tr");
      rowDetail.className = "row-detail hidden";
      const detailCell = document.createElement("td");
      detailCell.colSpan = 3;

      // Contenedor de tarjetas de sensores
      const sensorContainer = document.createElement("div");
      sensorContainer.className = "sensor-cards-container";

      if (Array.isArray(desc.sensores)) {
        desc.sensores.forEach((sensor) => {
          const card = document.createElement("div");
          card.className = "sensor-card";

          const h4 = document.createElement("h4");
          h4.textContent = sensor.nombre || sensor.id;
          card.appendChild(h4);

          // Mostrar pares clave-valor del sensor
          for (const [key, value] of Object.entries(sensor)) {
            if (value === null || key === "nombre") continue;
            const p = document.createElement("p");
            p.innerHTML = `<strong>${formatKey(key)}:</strong> ${formatValue(value)}`;
            card.appendChild(p);
          }

          sensorContainer.appendChild(card);
        });
      }

      detailCell.appendChild(sensorContainer);
      rowDetail.appendChild(detailCell);

      // Evento para expandir/colapsar detalle al hacer clic en la fila principal
      rowMain.addEventListener("click", () => {
        rowDetail.classList.toggle("hidden");
      });

      tbody.appendChild(rowMain);
      tbody.appendChild(rowDetail);
    });
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

/**
 * Formatea una fecha ISO (YYYY-MM-DDTHH:mm:ss) a solo YYYY-MM-DD.
 */
function formatDate(isoString) {
  if (!isoString) return "";
  return isoString.split("T")[0];
}

/**
 * Convierte claves en formato camelCase o snake_case a texto más legible.
 */
function formatKey(key) {
  // Reemplaza guiones bajos por espacios y capitaliza la primera letra
  const withSpaces = key.replace(/_/g, " ");
  return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
}

/**
 * Formatea valores según tipo (por ejemplo, fechas, números, etc.).
 */
function formatValue(val) {
  if (typeof val === "string" && val.includes("T")) {
    return formatDate(val);
  }
  return val;
}
