/**
 * view.js — Al cargarse:
 *  1) Lee todos los parámetros `featureTypeName` de la URL
 *  2) Para cada uno, hace un fetch a /api/filter-feature-of-interest?featureTypeName=…
 *  3) Si la llamada falla (500, etc.), muestra el error en pantalla bajo su título
 *  4) Si tiene éxito, imprime el JSON formateado y dibuja en el mapa cualquier `geo` que encuentre
 */

import { formatJSON } from "./view-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const titleEl = document.getElementById("viewTitle");
  const errorEl = document.getElementById("viewError");
  const jsonContainer = document.getElementById("jsonOutput");

  // 1) Leer todos los featureTypeName: view.html?featureTypeName=a&featureTypeName=b…
  const params = new URLSearchParams(window.location.search);
  const featureTypes = params.getAll("featureTypeName");

  if (featureTypes.length === 0) {
    errorEl.textContent = "⚠️ No se recibió ningún parámetro 'featureTypeName' en la URL.";
    return;
  }

  titleEl.textContent = `Feature of Interest: ${featureTypes.join(" , ")}`;

  // 2) Inicializa el mapa Leaflet (centrado en Galicia)
  const map = initMap();

  // 3) Para cada featureTypeName hacemos la petición y mostramos resultados
  for (const ft of featureTypes) {
    // Crear una sección independiente para este featureTypeName
    const section = document.createElement("section");
    section.className = "json-section";

    // Título de la sección
    const h2 = document.createElement("h2");
    h2.textContent = `featureTypeName: ${ft}`;
    section.appendChild(h2);

    // Mensaje de “Cargando…”
    const loading = document.createElement("p");
    loading.textContent = "Cargando datos…";
    section.appendChild(loading);

    try {
      const url = `/api/filter-feature-of-interest?featureTypeName=${encodeURIComponent(ft)}`;
      const resp = await fetch(url);
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} – ${resp.statusText}`);
      }
      const data = await resp.json();

      // Quitar “Cargando…”
      section.removeChild(loading);

      // Mostrar el JSON completo
      const pre = document.createElement("pre");
      pre.textContent = formatJSON(data);
      section.appendChild(pre);

      // Dibujar geometrías en el mapa
      data.forEach((feature) => {
        if (feature.geo && feature.geo.type && feature.geo.coordinates) {
          try {
            const geoJsonFeature = {
              type: "Feature",
              geometry: feature.geo,
              properties: {},
            };
            L.geoJSON(geoJsonFeature, {
              style: {
                color: "#ff0000",
                weight: 2,
                fillOpacity: 0.3,
              },
            }).addTo(map);
          } catch (e) {
            console.warn("No se pudo dibujar la geometría para", feature, e);
          }
        }
      });
    } catch (err) {
      // Quitar “Cargando…” y mostrar el error en rojo
      section.removeChild(loading);
      const errMsg = document.createElement("p");
      errMsg.textContent = `Error al obtener datos: ${err.message}`;
      errMsg.className = "error-msg";
      section.appendChild(errMsg);
    }

    // Añadir esta sección al contenedor principal
    jsonContainer.appendChild(section);
  }
});

/**
 * Inicializa el mapa Leaflet centrado en Galicia (EPSG:4326).
 * @returns {L.Map} La instancia del mapa creada.
 */
function initMap() {
  // Coordenadas aproximadas del centro de Galicia
  const galiciaCenter = [42.7284, -8.6538];
  const zoomInicial = 8;

  const map = L.map("map").setView(galiciaCenter, zoomInicial);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  return map;
}
