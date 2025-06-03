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

  // Ocultar cabecera de resultados hasta que haya datos
  document.querySelector(".results-header").style.display = "none";

  const typeName  = document.getElementById("processType").value.trim();
  const keyword   = document.getElementById("keywords").value.trim();
  const startTime = document.getElementById("startDate").value;
  const endTime   = document.getElementById("endDate").value;

  filterProcesses(typeName, keyword, startTime, endTime)
    .then(renderResults)
    .catch((err) => {
      const resultsContainer = document.getElementById("filterResults");
      const errorMsg = document.createElement("div");
      if (err.message.includes("500")) {
        errorMsg.textContent = "⚠️ Por favor, asegúrese de ingresar también la fecha de fin.";
      } else {
        errorMsg.textContent = `⚠️ ${err.message}`;
      }
      errorMsg.className = "error-msg";
      resultsContainer.appendChild(errorMsg);
    });
}
window.enviarFiltro = enviarFiltro;

function formatDateWithSeconds(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function renderResults(data) {
  const container = document.getElementById("filterResults");
  container.innerHTML = "";

  const countContainer = document.getElementById("resultsCount");
  const headerContainer = document.querySelector(".results-header");

  if (!Array.isArray(data) || data.length === 0) {
    headerContainer.style.display = "none";
    countContainer.textContent = "0 resultados encontrados";

    const noData = document.createElement("div");
    noData.textContent = "No se encontraron resultados para esos filtros.";
    noData.className = "no-data";
    container.appendChild(noData);
    return;
  }

  // Mostrar cabecera (botón y contador)
  headerContainer.style.display = "flex";

  // Contar cuántas descripciones hay en total
  const total = data.reduce(
    (acc, item) => acc + (Array.isArray(item.processDescription) ? item.processDescription.length : 0),
    0
  );
  countContainer.textContent = `${total} resultado${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;

  const table = document.createElement("table");
  table.className = "filter-table";

  // Encabezado: primera celda vacía para checkbox
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["", "Process ID", "Ship", "Valid Interval"].forEach((col) => {
    headerRow.appendChild(createHeading("th", col));
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  data.forEach(({ processId, processDescription }) => {
    if (!Array.isArray(processDescription)) return;

    processDescription.forEach((desc) => {
      const barco = desc.barco || "";
      const validInterval = `${formatDateWithSeconds(desc.validTimeStart)} – ${formatDateWithSeconds(desc.validTimeEnd)}`;

      // Fila principal con checkbox al inicio
      const rowMain = document.createElement("tr");
      rowMain.className = "row-main";

      // Celda con checkbox
      const tdCheckbox = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "result-checkbox";
      checkbox.dataset.processId = processId;
      // Evitar que al hacer clic en el checkbox se abra el detalle:
      checkbox.addEventListener("click", (e) => e.stopPropagation());
      tdCheckbox.appendChild(checkbox);
      rowMain.appendChild(tdCheckbox);

      // Celdas con Process ID, Ship, Valid Interval
      [processId, barco, validInterval].forEach((val) => {
        const td = document.createElement("td");
        td.textContent = val;
        rowMain.appendChild(td);
      });

      // Fila de detalle oculto
      const rowDetail = document.createElement("tr");
      rowDetail.className = "row-detail hidden";
      const detailCell = document.createElement("td");
      detailCell.colSpan = 4; // Ahora 4 columnas: checkbox + 3 columnas
      detailCell.style.padding = "0"; // Para que el contenido cuadre bien

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
        equipFields.forEach(([k, v]) =>
          card.appendChild(createLabeledParagraph(k, v, "measurement-text"))
        );
      }

      detailContainer.appendChild(card);

      detailContainer.appendChild(createHeading("h3", "Associated Sensors", "measurement-title"));
      const sensorContainer = document.createElement("div");
      sensorContainer.className = "sensor-cards-container";

      if (Array.isArray(desc.sensores)) {
        desc.sensores.forEach((sensor) => {
          const sensorCard = document.createElement("div");
          sensorCard.className = "sensor-card";

          sensorCard.appendChild(createHeading("h5", sensor.nombre || sensor.id, "sensor-name"));

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
          fields.forEach(([k, v]) =>
            fieldsContainer.appendChild(createLabeledParagraph(k, v))
          );
          sensorCard.appendChild(fieldsContainer);
          sensorContainer.appendChild(sensorCard);
        });
      }

      detailContainer.appendChild(sensorContainer);
      detailCell.appendChild(detailContainer);
      rowDetail.appendChild(detailCell);

      // Solo abrir/cerrar detalle al hacer clic en el resto de la fila (no en el checkbox)
      rowMain.addEventListener("click", () => rowDetail.classList.toggle("hidden"));

      tbody.appendChild(rowMain);
      tbody.appendChild(rowDetail);
    });
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // Configurar botón “Seleccionar todo”
  const selectAllBtn = document.getElementById("selectAllButton");
  if (selectAllBtn) {
    selectAllBtn.onclick = () => {
      const checkboxes = document.querySelectorAll(".result-checkbox");
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);

      // Si todos estaban marcados -> desmarcamos; si no -> marcamos todos
      checkboxes.forEach(cb => cb.checked = !allChecked);

      // Alternar clase 'active' en el botón:
      if (allChecked) {
        selectAllBtn.classList.remove("active"); // vuelve a azul
      } else {
        selectAllBtn.classList.add("active"); // se queda rosa
      }
    };
  }
}

// Utilidades auxiliares

function formatDate(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  return `${String(date.getUTCDate()).padStart(2, "0")}/${String(
    date.getUTCMonth() + 1
  ).padStart(2, "0")}/${date.getUTCFullYear()}`;
}

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
