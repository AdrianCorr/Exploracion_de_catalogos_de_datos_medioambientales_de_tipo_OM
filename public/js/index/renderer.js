// public/js/renderer.js

import { showModal } from "./modal.js";
import {
  fetchDataTypeByName,
  fetchFeatureTypeByName,
  fetchFilterFeatureOfInterest
} from "./api.js";
import { vocabMap } from "./helpers.js";

/**
 * Crea una sección de lista en el modal/accordion con título e ítems.
 * items = [{ name: string, type?: string, code?: string }]
 */
function createListSection(title, items) {
  const container = document.createElement("div");
  const h = document.createElement("h4");
  h.textContent = title;
  container.appendChild(h);
  const ul = document.createElement("ul");
  items.forEach((it) => {
    const li = document.createElement("li");
    if (it.code) li.dataset.code = it.code;
    if (it.type) {
      li.innerHTML = `<span class="prop-name">${it.name}</span><span class="prop-type">${it.type}</span>`;
    } else {
      li.textContent = it.name;
    }
    ul.appendChild(li);
  });
  container.appendChild(ul);
  return container;
}

/**
 * Renderiza un array de procesos como acordeones en #resultDisplay.
 */
export function renderResults(data) {
  const container = document.getElementById("resultDisplay");
  container.innerHTML = "";
  const vocabKey = vocabMap[document.getElementById("vocabulary").value] || "castellano";

  if (!Array.isArray(data) || data.length === 0) {
    container.textContent = "No se encontraron resultados.";
    return;
  }

  data.forEach((process) => {
    const section = document.createElement("section");
    section.className = "process-item";

    // --- Cabecera principal ---
    const header = document.createElement("div");
    header.className = "process-header";
    header.textContent = process.name;
    section.appendChild(header);

    // --- Detalle oculto ---
    const detail = document.createElement("div");
    detail.className = "process-detail hidden";

    // Traducción
    const nameObj = (process.names || []).find((n) => n.vocabulary === vocabKey);
    if (nameObj) {
      const p = document.createElement("p");
      p.className = "translation";
      p.textContent = `(${nameObj.term})`;
      detail.appendChild(p);
    }

    // Properties
    if (Array.isArray(process.properties)) {
      detail.appendChild(
        createListSection(
          "Properties",
          process.properties.map((p) => ({
            name:
              (p.names || []).find((n) => n.vocabulary === vocabKey)?.term ||
              p.name,
            type: p.data_type
          }))
        )
      );
    }

    // Supertypes
    if (Array.isArray(process.supertypes)) {
      detail.appendChild(
        createListSection(
          "Supertypes",
          process.supertypes.map((st) => ({ name: st }))
        )
      );
    }

    // Feature of Interest
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

      if (process.feature_of_interest_type.includes(".")) {
        foiLink.addEventListener("click", async (e) => {
          e.stopPropagation();
          const foitype = foiLink.textContent;

          // 1) Instanciar FOI (primer elemento de la lista)
          let inst = {};
          try {
            const list = await fetchFilterFeatureOfInterest({ featureTypeName: foitype });
            inst = Array.isArray(list) ? list[0] || {} : {};
          } catch (err) {
            console.warn("Error instanciando FOI:", err);
          }

          // 2) Metadata FOI
          let metaArr = [];
          try {
            metaArr = await fetchFeatureTypeByName(foitype);
          } catch (err) {
            console.warn("Error obteniendo metadata FOI:", err);
          }
          const meta = Array.isArray(metaArr) ? metaArr[0] : {};

          // 3) Construir contenido del modal
          const content = document.createElement("div");
          const h5Type = document.createElement("h5");
          h5Type.textContent = foitype;
          content.appendChild(h5Type);

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

          const ssf = meta.spatialSamplingFeatureType || {};
          const tblS = document.createElement("table");
          tblS.innerHTML = "<tr><th>Field</th><th>Value</th></tr>";

          // sampledFeatureType
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
              const nestedType = ssf.sampledFeatureType;

              // 3.1) Llamada al endpoint de Feature Types anidado
              let featMeta = [];
              try {
                featMeta = await fetchFeatureTypeByName(nestedType);
              } catch (err) {
                console.error("Error cargando Feature Type:", err);
                return;
              }
              const metaFT = Array.isArray(featMeta) ? featMeta[0] || {} : {};

              // 3.2) Construimos contenido del modal anidado
              const contentFT = document.createElement("div");

              // Clase
              if (metaFT.class) {
                const pClass = document.createElement("p");
                pClass.textContent = `Class: ${metaFT.class}`;
                contentFT.appendChild(pClass);
              }

              // Mostrar Sampled Feature Type y Supertypes
              const h5SFT = document.createElement("h5");
              h5SFT.textContent = `Sampled Feature Type: ${nestedType}`;
              contentFT.appendChild(h5SFT);

              if (Array.isArray(metaFT.supertypes) && metaFT.supertypes.length) {
                const h5Super = document.createElement("h5");
                h5Super.textContent = `Supertypes: ${metaFT.supertypes.join(", ")}`;
                contentFT.appendChild(h5Super);
              }

              // Contenedor scrollable para la tabla
              const scrollContainer = document.createElement("div");
              scrollContainer.classList.add("scrollable-table");

              // Tabla con los campos (fields)
              if (Array.isArray(metaFT.properties) && metaFT.properties.length) {
                const tblFT = document.createElement("table");
                tblFT.style.borderCollapse = "collapse";
                tblFT.style.width = "100%";
                tblFT.style.fontSize = "0.9rem";

                // Cabecera
                const thead = document.createElement("tr");
                thead.innerHTML = `
                  <th>Name</th>
                  <th>Type</th>
                  <th>Names</th>
                `;
                tblFT.appendChild(thead);

                // Filas
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
              }

              contentFT.appendChild(scrollContainer);
              showModal(nestedType, contentFT);
            });

            tdValue.appendChild(link);
            row.appendChild(tdValue);
            tblS.appendChild(row);
          }

          // shapeCRS
          if (ssf.shapeCRS) {
            const r = document.createElement("tr");
            r.innerHTML = `<td>shapeCRS</td><td>${ssf.shapeCRS}</td>`;
            tblS.appendChild(r);
          }
          // verticalCRS
          if (ssf.verticalCRS) {
            const r = document.createElement("tr");
            r.innerHTML = `<td>verticalCRS</td><td>${ssf.verticalCRS}</td>`;
            tblS.appendChild(r);
          }

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
          { name: process.observation_type }
        ])
      );
    }

    // Observed Properties
    if (Array.isArray(process.observed_properties)) {
      // 1) Creamos la sección una sola vez
      const obsSection = createListSection(
        "Observed Properties",
        process.observed_properties.map((op) => ({
          name:
            (op.names || []).find((n) => n.vocabulary === vocabKey)?.term ||
            op.name,
          code: op.name,
          type: op.data_type
        }))
      );
      detail.appendChild(obsSection);

      // 2) Recorremos todos los <span class="prop-type"> y, si son namespaced, los convertimos en enlaces
      obsSection.querySelectorAll("span.prop-type").forEach((typeSpan) => {
        const dt = typeSpan.textContent;
        if (dt.includes(".")) {
          typeSpan.classList.add("foi-link");

          typeSpan.addEventListener("click", async (e) => {
            e.stopPropagation();

            let dataTypeMeta = [];
            try {
              dataTypeMeta = await fetchDataTypeByName(dt);
            } catch (err) {
              console.error("Error cargando Data Type:", err);
              return;
            }

            const meta = Array.isArray(dataTypeMeta) ? dataTypeMeta[0] || {} : {};
            const content = document.createElement("div");
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
              tbl.style.borderCollapse = "collapse";
              tbl.style.width = "100%";
              tbl.style.fontSize = "0.9rem";

              const thead = document.createElement("tr");
              thead.innerHTML = `
                <th>Name</th>
                <th>Type</th>
                <th>cf_standard_names</th>
              `;
              tbl.appendChild(thead);

              meta.fields.forEach((field) => {
                const vocab = {};
                (field.names || []).forEach((n) => (vocab[n.vocabulary] = n.term));

                const row = document.createElement("tr");

                const tdName = document.createElement("td");
                tdName.innerHTML = `
                  <strong>castellano:</strong><br> ${vocab.castellano || ""}<br/>
                  <strong>galego:</strong><br> ${vocab.galego || ""}<br/>
                  <strong>english:</strong><br> ${vocab.english || ""}<br/>
                `;

                const tdDataType = document.createElement("td");
                if (field.data_type && field.data_type.includes(".")) {
                  const dtLink = document.createElement("span");
                  dtLink.className = "foi-link";
                  dtLink.textContent = field.data_type;
                  dtLink.style.cursor = "pointer";
                  dtLink.addEventListener("click", async (e) => {
                    e.stopPropagation();

                    let nestedMeta = [];
                    try {
                      nestedMeta = await fetchDataTypeByName(field.data_type);
                    } catch (err) {
                      console.error("Error cargando Data Type anidado:", err);
                      return;
                    }

                    const nested = Array.isArray(nestedMeta) ? nestedMeta[0] || {} : {};
                    const nestedContent = document.createElement("div");

                    // Si es una enumeración, la renderizamos con tablas/lists
                    if (nested.class === "enumeration" && Array.isArray(nested.values)) {
                      // Título de la enum
                      const h5Enum = document.createElement("h5");
                      h5Enum.textContent = `${nested.name} (enumeration)`;
                      h5Enum.classList.add("enumeration-title");
                      nestedContent.appendChild(h5Enum);

                      // Contenedor global de la enum
                      const enumContainer = document.createElement("div");
                      enumContainer.classList.add("enumeration-section");

                      nested.values.forEach((entry) => {
                        const vocTitle = document.createElement("h6");
                        vocTitle.textContent = entry.vocabulary;
                        enumContainer.appendChild(vocTitle);

                        const ul = document.createElement("ul");
                        entry.values.forEach((val) => {
                          const li = document.createElement("li");
                          li.textContent = val;
                          ul.appendChild(li);
                        });
                        enumContainer.appendChild(ul);
                      });

                      nestedContent.appendChild(enumContainer);
                    } else {
                      // Fallback: JSON crudo
                      const pre = document.createElement("pre");
                      pre.textContent = JSON.stringify(nested, null, 2);
                      pre.style.whiteSpace = "pre-wrap";
                      pre.style.maxHeight = "60vh";
                      pre.style.overflowY = "auto";
                      nestedContent.appendChild(pre);
                    }

                    showModal(field.data_type, nestedContent);
                  });
                  tdDataType.appendChild(dtLink);
                } else {
                  tdDataType.textContent = field.data_type || "";
                }

                // Celda cf_standard_names
                const tdCF = document.createElement("td");
                tdCF.textContent = vocab["cf_standard_names"] || "";

                // Montamos la fila y la añadimos a la tabla
                row.appendChild(tdName);
                row.appendChild(tdDataType);
                row.appendChild(tdCF);
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
    header.addEventListener("click", () => {
      detail.classList.toggle("hidden");
      section.classList.toggle("open");
    });

    // CREAR BOTÓN “FILTRAR” para cada proceso
    const filterBtn = document.createElement("button");
    filterBtn.textContent = "Filtrar";
    filterBtn.className = "filter-btn";
    // Evitamos que al pulsar el botón se abra/cierre el acordeón (stopPropagation())
    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      // Abrir ventana nueva con filter.html?processType=<nombre del proceso>
      const url = `filter.html?processType=${encodeURIComponent(process.name)}`;
      window.open(url, "_blank");
    });
    // Añadimos el botón al header del proceso
    section.appendChild(filterBtn);

    // Finalmente, añadimos la sección completa al contenedor de resultados
    container.appendChild(section);
  });
}
