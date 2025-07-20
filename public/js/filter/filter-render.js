// public/js/filter/filter-render.js

import {
  createHeading,
  createLabeledParagraph,
  createTitleWithSpan,
  formatDate,
  formatDateWithSeconds,
} from "./filter-utils.js";
import { setupResultInteractions } from "./filter-events.js";

/**
 * Renderiza los resultados del filtro en forma de tabla.
 * @param {Array} data - Array de objetos con processId y processDescription.
 */
export function renderResults(data) {
  const container = document.getElementById("filterResults");
  container.innerHTML = "";

  const countContainer = document.getElementById("resultsCount");
  const headerContainer = document.querySelector(".results-header");

  // Si no hay resultados, mostrar mensaje y ocultar controles
  if (!Array.isArray(data) || data.length === 0) {
    headerContainer.style.display = "none";
    countContainer.textContent = "0 resultados encontrados";

    const noData = document.createElement("div");
    noData.textContent = "No se encontraron resultados para esos filtros.";
    noData.className = "no-data";
    container.appendChild(noData);
    return;
  }

  // Mostrar cabecera con botones y contador
  headerContainer.style.display = "flex";

  // Calcular número total de descripciones de proceso
  const total = data.reduce(
    (acum, item) =>
      acum + (Array.isArray(item.processDescription) ? item.processDescription.length : 0),
    0
  );
  countContainer.textContent =
    `${total} resultado${total !== 1 ? "s" : ""} encontrado${total !== 1 ? "s" : ""}`;

  // Crear tabla de resultados
  const table = document.createElement("table");
  table.className = "filter-table";

  // Cabecera de la tabla
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  ["", "ID de Proceso", "Barco", "Intervalo válido"].forEach((col) => {
    headerRow.appendChild(createHeading("th", col));
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  // Construir filas por cada descripción de proceso
  data.forEach(({ processId, processDescription }) => {
    if (!Array.isArray(processDescription)) return;

    processDescription.forEach((desc) => {
      // Fila principal con checkbox y datos básicos
      const rowMain = document.createElement("tr");
      rowMain.className = "row-main";

      const tdCheckbox = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "result-checkbox";
      checkbox.dataset.start = desc.validTimeStart || "";
      checkbox.dataset.end = desc.validTimeEnd || "";
      checkbox.dataset.procedure = processId || "";
      checkbox.addEventListener("click", (e) => e.stopPropagation());
      tdCheckbox.appendChild(checkbox);
      rowMain.appendChild(tdCheckbox);

      // Celdas con información del proceso
      const barco = desc.barco || "";
      const validInterval =
        `${formatDateWithSeconds(desc.validTimeStart)} – ${formatDateWithSeconds(desc.validTimeEnd)}`;
      [processId, barco, validInterval].forEach((valor) => {
        const td = document.createElement("td");
        td.textContent = valor;
        rowMain.appendChild(td);
      });

      // Fila de detalle oculta inicialmente
      const rowDetail = document.createElement("tr");
      rowDetail.className = "row-detail hidden";
      const detailCell = document.createElement("td");
      detailCell.colSpan = 4;
      detailCell.style.padding = "0";

      const detailContainer = document.createElement("div");
      detailContainer.className = "detail-content";

      // Tarjeta de datos de la medición
      const card = document.createElement("div");
      card.className = "measurement-card";
      card.appendChild(
        createTitleWithSpan("Nombre", desc.nombre || "", "measurement-title-secondary")
      );
      if (desc.observaciones) {
        card.appendChild(
          createTitleWithSpan(
            "Observaciones",
            desc.observaciones,
            "measurement-title-secondary"
          )
        );
      }
      card.appendChild(createHeading("h3", "Equipo", "measurement-title"));

      // Detalles del equipo
      if (desc.equipo) {
        const equipFields = [
          ["ID", desc.equipo.id],
          ["Nombre", desc.equipo.nombre],
          ["Fabricante", desc.equipo.fabricante],
          ["Responsable", desc.equipo.responsable],
          ["Número de serie", desc.equipo.numero_serie],
          ["PNT mantenimiento", desc.equipo.pnt_mantenimiento],
          ["Fecha servicio", formatDate(desc.equipo.fecha_servicio)],
          ["Fecha recepción", formatDate(desc.equipo.fecha_recepcion)],
          ["Período mantenimiento", `${desc.equipo.periodo_mantenimiento} meses`],
        ];
        equipFields.forEach(([clave, valor]) =>
          card.appendChild(createLabeledParagraph(clave, valor, "measurement-text"))
        );
      }
      detailContainer.appendChild(card);

      // Sección de sensores asociados
      detailContainer.appendChild(
        createHeading("h3", "Sensores asociados", "measurement-title")
      );
      const sensorContainer = document.createElement("div");
      sensorContainer.className = "sensor-cards-container";

      if (Array.isArray(desc.sensores)) {
        desc.sensores.forEach((sensor) => {
          const sensorCard = document.createElement("div");
          sensorCard.className = "sensor-card";
          sensorCard.appendChild(
            createHeading("h5", sensor.nombre || sensor.id, "sensor-name")
          );

          const fields = [
            ["Número de serie", sensor.numero_serie],
            ["Rango", sensor.rango_medida],
            ["División de escala", sensor.division_escala],
            ["Fecha servicio", formatDate(sensor.fecha_servicio)],
            ["Fecha recepción", formatDate(sensor.fecha_recepcion)],
            ["PNT calibración", sensor.pnt_calibracion],
            ["PNT mantenimiento", sensor.pnt_mantenimiento],
            ["Período calibración", sensor.periodo_calibracion],
            ["Período mantenimiento", sensor.periodo_mantenimiento],
          ];

          const fieldsContainer = document.createElement("div");
          fieldsContainer.className = "sensor-fields";
          fields.forEach(([clave, valor]) =>
            fieldsContainer.appendChild(createLabeledParagraph(clave, valor))
          );
          sensorCard.appendChild(fieldsContainer);
          sensorContainer.appendChild(sensorCard);
        });
      }
      detailContainer.appendChild(sensorContainer);

      detailCell.appendChild(detailContainer);
      rowDetail.appendChild(detailCell);

      // Toggle de detalle al hacer clic en la fila principal
      rowMain.addEventListener("click", () => rowDetail.classList.toggle("hidden"));

      tbody.appendChild(rowMain);
      tbody.appendChild(rowDetail);
    });
  });

  table.appendChild(tbody);
  container.appendChild(table);

  // Habilitar selección y visualización tras el renderizado
  setupResultInteractions();
}
