/**
 * filter-render.js — Lógica para renderResults(data):
 *  • Monta la tabla de resultados dinámicamente
 *  • Añade checkbox, filas colapsables, cards de detalle
 *  • Muestra la cabecera de resultados (contador + botones)
 *  • Al final, invoca setupResultInteractions() para activar eventos en botones/checkbox
 */

import {
  createHeading,
  createLabeledParagraph,
  createTitleWithSpan,
  formatDate,
  formatDateWithSeconds,
} from "./filter-utils.js";

import { setupResultInteractions } from "./filter-events.js";

export function renderResults(data) {
  const container = document.getElementById("filterResults");
  container.innerHTML = "";

  const countContainer = document.getElementById("resultsCount");
  const headerContainer = document.querySelector(".results-header");

  // Si no hay datos o array vacío
  if (!Array.isArray(data) || data.length === 0) {
    headerContainer.style.display = "none";
    countContainer.textContent = "0 resultados encontrados";

    const noData = document.createElement("div");
    noData.textContent = "No se encontraron resultados para esos filtros.";
    noData.className = "no-data";
    container.appendChild(noData);
    return;
  }

  // Mostrar cabecera (contador + botones)
  headerContainer.style.display = "flex";

  // Calcular total de descripciones
  const total = data.reduce(
    (acc, item) =>
      acc + (Array.isArray(item.processDescription) ? item.processDescription.length : 0),
    0
  );
  countContainer.textContent = `${total} resultado${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;

  // Crear tabla
  const table = document.createElement("table");
  table.className = "filter-table";

  // THEAD con columna vacía para checkbox
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

      // Fila principal
      const rowMain = document.createElement("tr");
      rowMain.className = "row-main";

      // Celda con checkbox
      const tdCheckbox = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "result-checkbox";
      checkbox.dataset.processId = processId;
      // Evitar que el checkbox dispare la apertura del detalle
      checkbox.addEventListener("click", (e) => e.stopPropagation());
      tdCheckbox.appendChild(checkbox);
      rowMain.appendChild(tdCheckbox);

      // Celdas con Process ID, Ship, Valid Interval
      [processId, barco, validInterval].forEach((val) => {
        const td = document.createElement("td");
        td.textContent = val;
        rowMain.appendChild(td);
      });

      // Fila de detalle (oculta inicialmente)
      const rowDetail = document.createElement("tr");
      rowDetail.className = "row-detail hidden";
      const detailCell = document.createElement("td");
      detailCell.colSpan = 4;
      detailCell.style.padding = "0";

      const detailContainer = document.createElement("div");
      detailContainer.className = "detail-content";

      // Card de medición
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

      // Sección “Associated Sensors”
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
          fields.forEach(([k, v]) => fieldsContainer.appendChild(createLabeledParagraph(k, v)));
          sensorCard.appendChild(fieldsContainer);
          sensorContainer.appendChild(sensorCard);
        });
      }

      detailContainer.appendChild(sensorContainer);
      detailCell.appendChild(detailContainer);
      rowDetail.appendChild(detailCell);

      // Solo abrir/cerrar detalle al hacer clic en la fila (no en checkbox)
      rowMain.addEventListener("click", () => rowDetail.classList.toggle("hidden"));

      tbody.appendChild(rowMain);
      tbody.appendChild(rowDetail);
    });
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // Activar interacciones en botones/checkboxes
  setupResultInteractions();
}
