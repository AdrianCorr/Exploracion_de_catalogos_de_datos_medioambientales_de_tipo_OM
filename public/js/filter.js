document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const processType = params.get("processType") || "";
  document.getElementById("processType").value = decodeURIComponent(processType);
});

async function filterProcesses(typeName, keyword, startTime, endTime) {
  if (!typeName) throw new Error("Por favor, introduzca un nombre de tipo de proceso.");
  
  const params = new URLSearchParams({ processTypeName: typeName });
  if (keyword) params.append("keywordFilter", keyword);
  if (startTime) params.append("startTime", startTime);
  if (endTime) params.append("endTime", endTime);

  const resp = await fetch(`/api/filter-process?${params.toString()}`);
  if (!resp.ok) throw new Error(`Error HTTP ${resp.status}: ${resp.statusText}`);
  return await resp.json();
}
window.filterProcesses = filterProcesses;

function enviarFiltro() {
  const resultsContainer = document.getElementById("filterResults");
  resultsContainer.innerHTML = "";

  const typeName  = document.getElementById("processType").value.trim();
  const keyword   = document.getElementById("keywords").value.trim();
  const startTime = document.getElementById("startDate").value;
  const endTime   = document.getElementById("endDate").value;

  filterProcesses(typeName, keyword, startTime, endTime)
    .then(renderResults)
    .catch((err) => {
      const errorMsg = document.createElement("div");
      errorMsg.textContent = `⚠️ ${err.message}`;
      errorMsg.className = "error-msg";
      resultsContainer.appendChild(errorMsg);
    });
}
window.enviarFiltro = enviarFiltro;

function renderResults(data) {
  const container = document.getElementById("filterResults");
  container.innerHTML = "";

  if (!Array.isArray(data) || data.length === 0) {
    const noData = createHeading("div", "No se encontraron resultados para esos filtros.", "no-data");
    container.appendChild(noData);
    return;
  }

  const table = document.createElement("table");
  table.className = "filter-table";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["Process ID", "Ship", "Valid Interval"].forEach((col) =>
    headerRow.appendChild(createHeading("th", col))
  );
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  data.forEach(({ processId, processDescription }) => {
    if (!Array.isArray(processDescription)) return;

    processDescription.forEach((desc) => {
      const barco = desc.barco || "";
      const validInterval = `${formatDate(desc.validTimeStart)} – ${formatDate(desc.validTimeEnd)}`;

      const rowMain = document.createElement("tr");
      rowMain.className = "row-main";
      [processId, barco, validInterval].forEach((val) => {
        const td = document.createElement("td");
        td.textContent = val;
        rowMain.appendChild(td);
      });

      const rowDetail = document.createElement("tr");
      rowDetail.className = "row-detail hidden";
      const detailCell = document.createElement("td");
      detailCell.colSpan = 3;

      const detailContainer = document.createElement("div");
      detailContainer.className = "detail-content";

      const card = document.createElement("div");
      card.className = "measurement-card";
      card.appendChild(createTitleWithSpan("Name", desc.nombre || "", "measurement-title-secondary"));

      if (desc.observaciones) {
        card.appendChild(createTitleWithSpan("Observations", desc.observaciones, "measurement-title-secondary"));
      }

      card.appendChild(createHeading("h3", "Equipment", "measurement-title"));

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
          ["Maintenance Period", `${desc.equipo.periodo_mantenimiento} months`],
        ];
        equipFields.forEach(([k, v]) => card.appendChild(createLabeledParagraph(k, v, "measurement-text")));
      }

      detailContainer.appendChild(card);

      detailContainer.appendChild(createHeading("h3", "Associated Sensors", "measurement-title"));
      const sensorContainer = document.createElement("div");
      sensorContainer.className = "sensor-cards-container";

      if (Array.isArray(desc.sensores)) {
        desc.sensores.forEach((sensor) => {
          const card = document.createElement("div");
          card.className = "sensor-card";

          card.appendChild(createHeading("h5", sensor.nombre || sensor.id, "sensor-name"));

          const fields = [
            ["Serial Number", sensor.numero_serie],
            ["Range", sensor.rango_medida],
            ["Scale Division", sensor.division_escala],
            ["Service Date", formatDate(sensor.fecha_servicio)],
            ["Reception Date", formatDate(sensor.fecha_recepcion)],
            ["Calibration PNT", sensor.pnt_calibracion],
            ["Maintenance PNT", sensor.pnt_mantenimiento],
            ["Calibration Period", sensor.periodo_calibracion],
            ["Maintenance Period", sensor.periodo_mantenimiento],
          ];

          const fieldsContainer = document.createElement("div");
          fieldsContainer.className = "sensor-fields";
          fields.forEach(([k, v]) => fieldsContainer.appendChild(createLabeledParagraph(k, v)));
          card.appendChild(fieldsContainer);
          sensorContainer.appendChild(card);
        });
      }

      detailContainer.appendChild(sensorContainer);
      detailCell.appendChild(detailContainer);
      rowDetail.appendChild(detailCell);

      rowMain.addEventListener("click", () => rowDetail.classList.toggle("hidden"));

      tbody.appendChild(rowMain);
      tbody.appendChild(rowDetail);
    });
  });

  table.appendChild(tbody);
  container.appendChild(table);
}

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(date.getUTCMonth() + 1).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

// Utilidades auxiliares

function createHeading(tag, text, className = "") {
  const el = document.createElement(tag);
  el.textContent = text;
  if (className) el.className = className;
  return el;
}

function createLabeledParagraph(key, val, className = "") {
  const p = document.createElement("p");
  p.innerHTML = `<strong>${key}:</strong> ${val ?? "-"}`;
  if (className) p.className = className;
  return p;
}

function createTitleWithSpan(label, text, className) {
  const heading = createHeading("h4", `${label}: `, className);
  const span = document.createElement("span");
  span.textContent = text;
  heading.appendChild(span);
  return heading;
}
