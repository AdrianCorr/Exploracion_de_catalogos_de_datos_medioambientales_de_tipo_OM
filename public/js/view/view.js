// public/js/view/view.js

import { formatJSON } from "./view-utils.js";

document.addEventListener("DOMContentLoaded", async () => {
  const titleEl = document.getElementById("viewTitle");
  const errorEl = document.getElementById("viewError");
  const jsonContainer = document.getElementById("jsonOutput");

  // 1) Leer todos los parámetro featureTypeName de la URL:
  //    Ejemplo: view.html?featureTypeName=ctd_intecmar.ria&featureTypeName=otraFeature
  const params = new URLSearchParams(window.location.search);
  const featureTypes = params.getAll("featureTypeName");

  // Leer también startTime y endTime si existen (opcional)
  const startTimeParam = params.get("startTime") || "";
  const endTimeParam   = params.get("endTime")   || "";

  if (featureTypes.length === 0) {
    errorEl.textContent = "⚠️ No se recibió ningún parámetro 'featureTypeName' en la URL.";
    return;
  }

  // Mostrar el título indicando los Feature Types solicitados
  titleEl.textContent = `Feature of Interest: ${featureTypes.join(" , ")}`;

  // 2) Inicializar el mapa Leaflet (centrado en Galicia)
  const map = initMap();

  // 3) Para cada featureTypeName, encadenar las llamadas a la API
  for (const ft of featureTypes) {
    // Crear una sección (section) para este ft
    const section = document.createElement("section");
    section.className = "json-section";

    // Título de la sección
    const h2 = document.createElement("h2");
    h2.textContent = `featureTypeName: ${ft}`;
    section.appendChild(h2);

    // Mostrar los parámetros temporales, si existen
    if (startTimeParam && endTimeParam) {
      const pTime = document.createElement("p");
      pTime.textContent = `Intervalo: ${startTimeParam}  –  ${endTimeParam}`;
      pTime.style.fontStyle = "italic";
      section.appendChild(pTime);
    }

    // Mensaje de “Cargando…”
    const loading = document.createElement("p");
    loading.textContent = "Cargando datos…";
    section.appendChild(loading);

    try {
      // —— A) fetchFeatureTypeByName(featureTypeName)
      const respMeta1 = await fetch(
        `/api/feature-type-by-name?featureTypeName=${encodeURIComponent(ft)}`
      );
      if (!respMeta1.ok) {
        throw new Error(`HTTP ${respMeta1.status} – ${respMeta1.statusText}`);
      }
      const arrMeta1 = await respMeta1.json();
      const meta1 = Array.isArray(arrMeta1) ? arrMeta1[0] || {} : {};

      // Extraer sampledFeatureType
      const sampledFeatureType = meta1.spatialSamplingFeatureType?.sampledFeatureType;
      if (!sampledFeatureType) {
        throw new Error("No se encontró 'spatialSamplingFeatureType.sampledFeatureType' en los metadatos.");
      }

      // —— B) fetchFeatureTypeByName(sampledFeatureType) para obtener geoDefinition
      const respMeta2 = await fetch(
        `/api/feature-type-by-name?featureTypeName=${encodeURIComponent(sampledFeatureType)}`
      );
      if (!respMeta2.ok) {
        throw new Error(`HTTP ${respMeta2.status} – ${respMeta2.statusText}`);
      }
      const arrMeta2 = await respMeta2.json();
      const meta2 = Array.isArray(arrMeta2) ? arrMeta2[0] || {} : {};
      const geoDefinition = meta2.geo; // Debe ser un GeoJSON: { type: "...", coordinates: [...] }
      if (!geoDefinition || !geoDefinition.type || !geoDefinition.coordinates) {
        console.warn("Advertencia: meta2.geo no contiene un GeoJSON válido.");
      }

      // —— C) fetchFilterFeatureOfInterest({ featureTypeName: sampledFeatureType, timeFilter… })
      // Si quieres filtrar por startTime/endTime en el API (si lo soporta), los agregas aquí:
      let urlInst = `/api/filter-feature-of-interest?featureTypeName=${encodeURIComponent(sampledFeatureType)}`;
      if (startTimeParam) urlInst += `&keywordFilter=&geometryFilter=&timeFilter=${encodeURIComponent(startTimeParam)}`;
      // (Si el endpoint soporta timeFilter; en muchos casos no, así que puedes omitirlo)
      const respInst = await fetch(urlInst);
      if (!respInst.ok) {
        throw new Error(`HTTP ${respInst.status} – ${respInst.statusText}`);
      }
      const instances = await respInst.json();

      // Quitar “Cargando…”
      section.removeChild(loading);

      // Mostrar TODOS los JSON concatenados en un único <pre>
      const combined = {
        featureTypeMetadata: meta1,
        sampledFeatureTypeMetadata: meta2,
        instances: instances,
      };
      const pre = document.createElement("pre");
      pre.textContent = formatJSON(combined);
      section.appendChild(pre);

      // —— 4) Dibujar en el mapa la definición global del polígono (geoDefinition) en azul semitransparente
      if (geoDefinition && geoDefinition.type && geoDefinition.coordinates) {
        try {
          const featureGeoDef = {
            type: "Feature",
            geometry: geoDefinition,
            properties: {},
          };
          L.geoJSON(featureGeoDef, {
            style: {
              color: "#0000FF",
              weight: 2,
              fillOpacity: 0.1,
            },
          }).addTo(map);
        } catch (e) {
          console.warn("Error al dibujar definición global del polígono (meta2.geo):", e);
        }
      }

      // —— 5) Dibujar cada instancia de “instances” en rojo semitransparente
      instances.forEach((feature) => {
        if (feature.geo && feature.geo.type && feature.geo.coordinates) {
          try {
            const featureGeoInst = {
              type: "Feature",
              geometry: feature.geo,
              properties: {},
            };
            L.geoJSON(featureGeoInst, {
              style: {
                color: "#FF0000",
                weight: 1,
                fillOpacity: 0.3,
              },
            }).addTo(map);
          } catch (e) {
            console.warn("Error al dibujar instancia geo:", e);
          }
        }
      });
    } catch (err) {
      // Quitar “Cargando…” y mostrar el error
      section.removeChild(loading);
      const errMsg = document.createElement("p");
      errMsg.textContent = `Error para '${ft}': ${err.message}`;
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
