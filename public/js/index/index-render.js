// public/js/index-render.js

import { showModal } from "./index-modal.js";
import {
  fetchDataTypeByName,
  fetchFeatureTypeByName,
  fetchFilterFeatureOfInterest,
} from "./index-api.js";
import { vocabMap } from "./index-helpers.js";

/**
 * Crea una sección de lista con encabezado y elementos para mostrar en modal o acordeón.
 * @param {string} title  Texto del título de la sección.
 * @param {Array<{name: string, type?: string, code?: string}>} items  Elementos a listar.
 * @returns {HTMLElement} Contenedor con la sección y su lista.
 */
function createListSection(title, items) {
  const container = document.createElement("div");
  const heading = document.createElement("h4");
  heading.textContent = title;
  container.appendChild(heading);

  const ul = document.createElement("ul");
  items.forEach((item) => {
    const li = document.createElement("li");
    if (item.code) {
      li.dataset.code = item.code;
    }
    if (item.type) {
      li.innerHTML =
        `<span class="prop-name">${item.name}</span>` +
        `<span class="prop-type">${item.type}</span>`;
    } else {
      li.textContent = item.name;
    }
    ul.appendChild(li);
  });
  container.appendChild(ul);
  return container;
}

/**
 * Renderiza los procesos como secciones desplegables en el contenedor de resultados.
 * @param {Array<Object>} data  Array de objetos con información de procesos.
 */
export function renderResults(data) {
  const container = document.getElementById("resultDisplay");
  container.innerHTML = "";

  // Clave de vocabulario seleccionada o valor por defecto
  const vocabKey =
    vocabMap[document.getElementById("vocabulary").value] || "castellano";

  // Si no hay datos, mostrar mensaje y salir
  if (!Array.isArray(data) || data.length === 0) {
    container.textContent = "No se encontraron resultados.";
    return;
  }

  data.forEach((process) => {
    // Sección principal del proceso
    const section = document.createElement("section");
    section.className = "process-item";

    // Cabecera visible con el nombre del proceso
    const header = document.createElement("div");
    header.className = "process-header";
    header.textContent = process.name;
    section.appendChild(header);

    // Contenedor de detalles inicialmente oculto
    const detail = document.createElement("div");
    detail.className = "process-detail hidden";

    // Traducción al vocabulario seleccionado
    const nameObj = (process.names || []).find(
      (n) => n.vocabulary === vocabKey
    );
    if (nameObj) {
      const p = document.createElement("p");
      p.className = "translation";
      p.textContent = `(${nameObj.term})`;
      detail.appendChild(p);
    }

    // Propiedades del proceso
    if (Array.isArray(process.properties)) {
      const props = process.properties.map((p) => ({
        name:
          (p.names || []).find((n) => n.vocabulary === vocabKey)?.term ||
          p.name,
        type: p.data_type,
      }));
      detail.appendChild(createListSection("Properties", props));
    }

    // Supertypes (supertipos)
    if (Array.isArray(process.supertypes)) {
      const supertypes = process.supertypes.map((st) => ({ name: st }));
      detail.appendChild(createListSection("Supertypes", supertypes));
    }

    // Feature of Interest (característica de interés)
    if (process.feature_of_interest_type) {
      const foiContainer = document.createElement("div");
      const foiTitle = document.createElement("h4");
      foiTitle.textContent = "Feature of Interest";
      foiContainer.appendChild(foiTitle);

      const foiLink = document.createElement("span");
      foiLink.className = "foi-link";
      foiLink.textContent = process.feature_of_interest_type;
      foiContainer.appendChild(foiLink);
      detail.appendChild(foiContainer);

      // Si el tipo es namespaced, permitir clic para abrir modal con detalles
      if (process.feature_of_interest_type.includes(".")) {
        foiLink.addEventListener("click", async (e) => {
          e.stopPropagation();
          const foitype = foiLink.textContent;

          // Obtener instancia de FOI y metadata
          let inst = {};
          try {
            const list = await fetchFilterFeatureOfInterest({
              featureTypeName: foitype,
            });
            inst = Array.isArray(list) ? list[0] || {} : {};
          } catch (err) {
            console.warn("Error instanciando FOI:", err);
          }

          let metaArr = [];
          try {
            metaArr = await fetchFeatureTypeByName(foitype);
          } catch (err) {
            console.warn("Error obteniendo metadata FOI:", err);
          }
          const meta = Array.isArray(metaArr) ? metaArr[0] : {};

          // Construir contenido del modal con metadata
          const content = document.createElement("div");
          const h5Type = document.createElement("h5");
          h5Type.textContent = foitype;
          content.appendChild(h5Type);

          // Propiedades de la feature
          if (Array.isArray(meta.properties) && meta.properties.length) {
            const tblP = document.createElement("table");
            tblP.innerHTML = `<tr><th>Name</th><th>Type</th></tr>`;
            meta.properties.forEach((p) => {
              tblP.innerHTML += `<tr><td>${p.name}</td><td>${p.data_type}</td></tr>`;
            });
            content.appendChild(document.createElement("br"));
            const h5P = document.createElement("h5");
            h5P.textContent = "Properties:";
            content.appendChild(h5P);
            content.appendChild(tblP);
          }

          // Datos de muestreo espacial
          const ssf = meta.spatialSamplingFeatureType || {};
          const tblS = document.createElement("table");
          tblS.innerHTML = `<tr><th>Field</th><th>Value</th></tr>`;

          if (ssf.sampledFeatureType) {
            const row = document.createElement("tr");
            const tdField = document.createElement("td");
            tdField.textContent = "sampledFeatureType";
            row.appendChild(tdField);

            const tdValue = document.createElement("td");
            const link = document.createElement("span");
            link.className = "foi-link";
            link.textContent = ssf.sampledFeatureType;
            link.style.cursor = "pointer";
            link.style.color = "var(--primary-color)";
            link.style.textDecoration = "underline";

            link.addEventListener("click", async (e) => {
              e.stopPropagation();
              // Carga recursiva de metadata anidada
              let featMeta = [];
              try {
                featMeta = await fetchFeatureTypeByName(ssf.sampledFeatureType);
              } catch (err) {
                console.error("Error cargando Feature Type anidado:", err);
                return;
              }
              const metaFT = Array.isArray(featMeta) ? featMeta[0] || {} : {};

              // Construir modal con detalles de Feature Type anidado
              const contentFT = document.createElement("div");
              if (metaFT.class) {
                const pClass = document.createElement("p");
                pClass.textContent = `Class: ${metaFT.class}`;
                contentFT.appendChild(pClass);
              }

              const h5SFT = document.createElement("h5");
              h5SFT.textContent = `Sampled Feature Type: ${ssf.sampledFeatureType}`;
              contentFT.appendChild(h5SFT);

              // Tabla de propiedades anidadas
              const scrollContainer = document.createElement("div");
              scrollContainer.classList.add("scrollable-table");
              if (
                Array.isArray(metaFT.properties) &&
                metaFT.properties.length
              ) {
                const tblFT = document.createElement("table");
                tblFT.style.borderCollapse = "collapse";
                metaFT.properties.forEach((p) => {
                  const vocab = {};
                  (p.names || []).forEach((n) => (vocab[n.vocabulary] = n.term));
                  const Frow = document.createElement("tr");
                  Frow.innerHTML = `
                    <td>${p.name}</td>
                    <td>${p.data_type}</td>
                    <td>
                      <strong>castellano:</strong> ${vocab.castellano || ""}<br/>
                      <strong>galego:</strong> ${vocab.galego || ""}<br/>
                      <strong>english:</strong> ${vocab.english || ""}<br/>
                      ${
                        vocab.cf_standard_names
                          ? `<strong>cf_standard_names:</strong> ${vocab.cf_standard_names}`
                          : ""
                      }
                    </td>
                  `;
                  tblFT.appendChild(Frow);
                });
                scrollContainer.appendChild(tblFT);
                contentFT.appendChild(scrollContainer);
              }

              showModal(ssf.sampledFeatureType, contentFT);
            });

            tdValue.appendChild(link);
            row.appendChild(tdValue);
            tblS.appendChild(row);
          }

          ["shapeCRS", "verticalCRS"].forEach((field) => {
            if (ssf[field]) {
              const r = document.createElement("tr");
              r.innerHTML = `<td>${field}</td><td>${ssf[field]}</td>`;
              tblS.appendChild(r);
            }
          });

          content.appendChild(document.createElement("br"));
          const h5ssf = document.createElement("h5");
          h5ssf.textContent = "Spatial Sampling Feature Type:";
          content.appendChild(h5ssf);
          content.appendChild(tblS);

          showModal(foitype, content);
        });
      }
    }

    // Observation Type
    if (process.observation_type) {
      detail.appendChild(
        createListSection("Observation Type", [
          { name: process.observation_type },
        ])
      );
    }

    // Observed Properties
    if (Array.isArray(process.observed_properties)) {
      const obsItems = process.observed_properties.map((op) => ({
        name:
          (op.names || []).find((n) => n.vocabulary === vocabKey)?.term ||
          op.name,
        code: op.name,
        type: op.data_type,
      }));
      const obsSection = createListSection(
        "Observed Properties",
        obsItems
      );
      detail.appendChild(obsSection);

      // Enlazar tipos namespaced para mostrar modal de Data Type
      obsSection.querySelectorAll("span.prop-type").forEach((span) => {
        const dt = span.textContent;
        if (dt.includes(".")) {
          span.classList.add("foi-link");
          span.addEventListener("click", async (e) => {
            e.stopPropagation();
            const content = document.createElement("div");

            let dataTypeMeta = [];
            try {
              dataTypeMeta = await fetchDataTypeByName(dt);
            } catch (err) {
              console.error("Error cargando Data Type:", err);
              return;
            }
            const meta = Array.isArray(dataTypeMeta) ? dataTypeMeta[0] : {};

            const h5Type = document.createElement("h5");
            h5Type.textContent = dt;
            content.appendChild(h5Type);

            if (meta.class) {
              const pClass = document.createElement("p");
              pClass.textContent = `Class: ${meta.class}`;
              content.appendChild(pClass);
            }

            const scrollContainer = document.createElement("div");
            scrollContainer.classList.add("scrollable-table");
            if (Array.isArray(meta.fields)) {
              const tbl = document.createElement("table");
              const headerRow = document.createElement("tr");
              headerRow.innerHTML = `<th>Names</th><th>Type</th><th>Variable Name</th>`;
              tbl.appendChild(headerRow);
              meta.fields.forEach((field) => {
                const vocab = {};
                (field.names || []).forEach((n) => (vocab[n.vocabulary] = n.term));
                const row = document.createElement("tr");
                row.innerHTML = `
                  <td>
                    <strong>castellano:</strong><br/>${vocab.castellano || ""}<br/>
                    <strong>galego:</strong><br/>${vocab.galego || ""}<br/>
                    <strong>english:</strong><br/>${vocab.english || ""}
                  </td>
                  <td>${field.data_type || ""}</td>
                  <td>${vocab.cf_standard_names || ""}</td>
                `;
                tbl.appendChild(row);
              });
              scrollContainer.appendChild(tbl);
              content.appendChild(scrollContainer);
            }

            showModal(dt, content);
          });
        }
      });
    }

    section.appendChild(detail);
    // Alternar visibilidad de detalles al hacer clic en el encabezado
    header.addEventListener("click", () => {
      detail.classList.toggle("hidden");
      section.classList.toggle("open");
    });

    // Botón para aplicar filtro a un proceso específico
    const filterBtn = document.createElement("button");
    filterBtn.textContent = "Filtrar";
    filterBtn.className = "filter-btn";
    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const url = `filter.html?processType=${encodeURIComponent(
        process.name
      )}`;
      window.open(url, "_blank");
    });
    section.appendChild(filterBtn);

    // Añadir la sección de proceso al contenedor principal
    container.appendChild(section);
  });
}