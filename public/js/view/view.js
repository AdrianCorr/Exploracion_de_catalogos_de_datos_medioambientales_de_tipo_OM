/**
 * view.js — Al cargarse, lee los IDs pasados en la URL,
 *          recupera window.opener.lastFilterData (JSON de filter),
 *          filtra por esos IDs y muestra el resultado en pantalla.
 *
 * Requisitos:
 *  • Filter (“filter-render.js”) debe haber guardado el JSON completo en window.lastFilterData
 *  • Al pulsar “View Observations”, se abre view.html? id=... , pasando los IDs como parámetros “id”
 *  • Aquí recuperamos ese JSON de window.opener y lo imprimimos en <div id="jsonOutput">
 *  • Adicionalmente, inicializamos un mapa Leaflet vacío (centrado en Galicia)
 */

import { formatJSON } from "./view-utils.js";

document.addEventListener("DOMContentLoaded", () => {
  const titleEl = document.getElementById("viewTitle");
  const errorEl = document.getElementById("viewError");
  const jsonContainer = document.getElementById("jsonOutput");

  // 1) Leer parámetros: ?id=123&id=456&id=789 ...
  const params = new URLSearchParams(window.location.search);
  const ids = params.getAll("id"); // devuelve array de strings

  if (ids.length === 0) {
    errorEl.textContent = "⚠️ No se recibieron IDs de procesos seleccionados.";
    return;
  }

  // Mostrar encabezado con IDs
  titleEl.textContent = `Observaciones seleccionadas (IDs): ${ids.join(", ")}`;

  // 2) Acceder a window.opener.lastFilterData
  if (!window.opener || !Array.isArray(window.opener.lastFilterData)) {
    errorEl.textContent = "⚠️ Imposible recuperar los datos de la ventana anterior.";
    return;
  }

  const allData = window.opener.lastFilterData;

  // 3) Filtrar solo los objetos cuyo processId esté en ids[]
  const filtered = allData.filter((item) => ids.includes(String(item.processId)));

  if (filtered.length === 0) {
    errorEl.textContent = "⚠️ Ninguna coincidencia encontrada en el JSON original.";
    return;
  }

  // 4) Mostrar el JSON filtrado dentro de <div id="jsonOutput">
  const pre = document.createElement("pre");
  pre.textContent = formatJSON(filtered);
  jsonContainer.appendChild(pre);

  // 5) Inicializar mapa Leaflet vacío (centrado en Galicia)
  initMap();
});

function initMap() {
  // Centro aproximado de Galicia
  const galiciaCenter = [42.7284, -8.6538];
  const zoomInicial = 8;

  const map = L.map("map").setView(galiciaCenter, zoomInicial);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  // Por ahora no añadimos marcadores; el mapa queda centrado en Galicia
}
