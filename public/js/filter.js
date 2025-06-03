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
window.filterProcesses = filterProcesses;

/**
 * Función que se llama cuando el usuario pulsa “Aplicar Filtro”.
 * Lee los valores del formulario y muestra los resultados procesados.
 */
function enviarFiltro() {
  const resultsContainer = document.getElementById("filterResults");
  resultsContainer.innerHTML = "";

  const typeName  = document.getElementById("processType").value.trim();
  const keyword   = document.getElementById("keywords").value.trim();
  const startTime = document.getElementById("startDate").value;
  const endTime   = document.getElementById("endDate").value;

  filterProcesses(typeName, keyword, startTime, endTime)
    .then((data) => {
      renderResults(data);
    })
    .catch((err) => {
      const errorMsg = document.createElement("div");
      errorMsg.textContent = `⚠️ ${err.message}`;
      errorMsg.className = "error-msg";
      resultsContainer.appendChild(errorMsg);
    });
}
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
    noData.className = "no-data";
    container.appendChild(noData);
    return;
  }

  const table = document.createElement("table");
  table.className = "filter-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Process ID", "Ship", "Valid Interval"].forEach((colName) => {
    const th = document.createElement("th");
    th.textContent = colName;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  data.forEach((item) => {
    const processId = item.processId;
    if (!Array.isArray(item.processDescription)) return;

    item.processDescription.forEach((desc) => {
      const barco = desc.barco || "";
      const validInterval = `${formatDate(desc.validTimeStart)} – ${formatDate(desc.validTimeEnd)}`;

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

      const rowDetail = document.createElement("tr");
      rowDetail.className = "row-detail hidden";
      const detailCell = document.createElement("td");
      detailCell.colSpan = 3;

      const detailContainer = document.createElement("div");
      detailContainer.className = "detail-content";

      const measurementCard = document.createElement("div");
      measurementCard.className = "measurement-card";

      const title = document.createElement("h3");
      title.textContent = desc.nombre || "";
      title.className = "measurement-title";
      measurementCard.appendChild(title);

      if (desc.observaciones) {
        const obs = document.createElement("p");
        obs.textContent = `Observations: ${desc.observaciones}`;
        obs.className = "measurement-text";
        measurementCard.appendChild(obs);
      }

      const equipTitle = document.createElement("h4");
      equipTitle.textContent = "Equipment";
      equipTitle.className = "measurement-subtitle";
      measurementCard.appendChild(equipTitle);

      if (desc.equipo) {
        const equipFields = [
          ["ID", desc.equipo.id],
          ["Name", desc.equipo.nombre],
          ["Manufacturer", desc.equipo.fabricante],
          ["Responsible", desc.equipo.responsable],
          ["Serial Number", desc.equipo.numero_serie],
          ["Maintenance PNT", desc.equipo.pnt_mantenimiento],
          ["Service Date", formatDate(desc.equipo.fecha_servicio)],
          ["Reception Date", formatDate(desc.equipo.fecha_recepcion)],
          ["Maintenance Period", `${desc.equipo.periodo_mantenimiento} months`]
        ];
        equipFields.forEach(([key, val]) => {
          const p = document.createElement("p");
          p.textContent = `${key}: ${val !== null && val !== undefined ? val : "-"}`;
          p.className = "measurement-text";
          measurementCard.appendChild(p);
        });
      }

      detailContainer.appendChild(measurementCard);

      const sensorSectionTitle = document.createElement("h4");
      sensorSectionTitle.textContent = "Associated Sensors";
      sensorSectionTitle.className = "measurement-subtitle";
      detailContainer.appendChild(sensorSectionTitle);

      const sensorContainer = document.createElement("div");
      sensorContainer.className = "sensor-cards";

      if (Array.isArray(desc.sensores)) {
        desc.sensores.forEach((sensor) => {
          const card = document.createElement("div");
          card.className = "sensor-card";

          const name = document.createElement("h5");
          name.textContent = sensor.nombre || sensor.id;
          name.className = "sensor-name";
          card.appendChild(name);

          const sensorFields = [
            ["Serial Number", sensor.numero_serie],
            ["Range", sensor.rango_medida],
            ["Scale Division", sensor.division_escala],
            ["Service Date", formatDate(sensor.fecha_servicio)],
            ["Reception Date", formatDate(sensor.fecha_recepcion)],
            ["Calibration PNT", sensor.pnt_calibracion],
            ["Maintenance PNT", sensor.pnt_mantenimiento],
            ["Calibration Period", sensor.periodo_calibracion],
            ["Maintenance Period", sensor.periodo_mantenimiento]
          ];

          const fieldsContainer = document.createElement("div");
          fieldsContainer.className = "sensor-fields";
          sensorFields.forEach(([key, val]) => {
            const p = document.createElement("p");
            p.innerHTML = `<strong>${key}:</strong> ${val !== null && val !== undefined ? val : "-"}`;
            fieldsContainer.appendChild(p);
          });
          card.appendChild(fieldsContainer);

          sensorContainer.appendChild(card);
        });
      }

      detailContainer.appendChild(sensorContainer);
      detailCell.appendChild(detailContainer);
      rowDetail.appendChild(detailCell);

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
 * Convierte fecha ISO a formato DD/MM/YYYY.
 */
function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
