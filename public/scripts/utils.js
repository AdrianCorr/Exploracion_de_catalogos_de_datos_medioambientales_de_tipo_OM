// utils.js

// Mapa de vocabularios para traducciones
const vocabMap = { es: 'castellano', gl: 'galego', en: 'english' };

/**
 * Muestra un modal superpuesto con un título y contenido HTML.
 */
function showModal(titleText, contentElement) {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = '';
  const modal = document.createElement('div'); modal.className = 'modal';
  const header = document.createElement('div'); header.className = 'modal-header';
  header.textContent = titleText;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'modal-close'; closeBtn.textContent = '×';
  closeBtn.onclick = () => overlay.classList.add('hidden');
  header.appendChild(closeBtn);
  const body = document.createElement('div'); body.className = 'modal-body';
  body.appendChild(contentElement);
  modal.appendChild(header); modal.appendChild(body);
  overlay.appendChild(modal);
  overlay.classList.remove('hidden');
}

/**
 * Crea una sección de lista en el modal/accordion con título e ítems.
 * items = [{ name: string, type?: string }]
 */
function createListSection(title, items) {
  const container = document.createElement('div');
  const h = document.createElement('h4'); h.textContent = title;
  container.appendChild(h);
  const ul = document.createElement('ul');
  items.forEach(it => {
    const li = document.createElement('li');
    if (it.code) li.dataset.code = it.code;
    if (it.type) li.innerHTML = `<span class="prop-name">${it.name}</span><span class="prop-type">${it.type}</span>`;
    else li.textContent = it.name;
    ul.appendChild(li);
  });
  container.appendChild(ul);
  return container;
}

/**
 * Renderiza un array de procesos como acordeones en #resultDisplay.
 */
async function renderResults(data) {
  const container = document.getElementById('resultDisplay');
  container.innerHTML = '';
  const vocabKey = vocabMap[document.getElementById('vocabulary').value] || 'castellano';

  if (!Array.isArray(data) || !data.length) {
    container.textContent = 'No se encontraron resultados.';
    return;
  }

  for (const process of data) {
    const section = document.createElement('section');
    section.className = 'process-item';

    // --- Cabecera principal ---
    const header = document.createElement('div');
    header.className = 'process-header';
    header.textContent = process.name;
    section.appendChild(header);

    // --- Detalle oculto ---
    const detail = document.createElement('div');
    detail.className = 'process-detail hidden';

    // Traducción
    const nameObj = (process.names || []).find(n => n.vocabulary === vocabKey);
    if (nameObj) {
      const p = document.createElement('p');
      p.className = 'translation';
      p.textContent = `(${nameObj.term})`;
      detail.appendChild(p);
    }

    // Properties
    if (Array.isArray(process.properties)) {
      detail.appendChild(createListSection(
        'Properties',
        process.properties.map(p => ({
          name: (p.names || []).find(n => n.vocabulary === vocabKey)?.term || p.name,
          type: p.data_type
        }))
      ));
    }

    // Supertypes
    if (Array.isArray(process.supertypes)) {
      detail.appendChild(createListSection(
        'Supertypes',
        process.supertypes.map(st => ({ name: st }))
      ));
    }

    // Feature of Interest
    if (process.feature_of_interest_type) {
      const foiContainer = document.createElement('div');
      const foiTitle = document.createElement('h4');
      foiTitle.textContent = 'Feature of Interest';
      foiContainer.appendChild(foiTitle);

      const foiLink = document.createElement('span');
      foiLink.className = 'foi-link';
      foiLink.textContent = process.feature_of_interest_type;
      foiContainer.appendChild(foiLink);
      detail.appendChild(foiContainer);

      if (process.feature_of_interest_type.includes('.')) {
        foiLink.addEventListener('click', async e => {
          e.stopPropagation();
          const foitype = foiLink.textContent;

          // 1) Instancia FOI
          let inst = {};
          try {
            const list = await window.filterFeatureOfInterest(foitype);
            inst = list[0] || {};
          } catch (err) {
            console.warn('Error instanciando FOI:', err);
          }

          // 2) Metadata FOI
          let metaArr = [];
          try {
            metaArr = await window.fetchFeatureType(foitype);
          } catch (err) {
            console.warn('Error obteniendo metadata FOI:', err);
          }
          const meta = Array.isArray(metaArr) ? metaArr[0] : {};

          // 3) Construir modal
          const content = document.createElement('div');
          const h5Type = document.createElement('h5');
          h5Type.textContent = foitype;
          content.appendChild(h5Type);

          if (Array.isArray(meta.properties) && meta.properties.length) {
            const tblP = document.createElement('table');
            tblP.innerHTML = `<tr><th>Name</th><th>Type</th></tr>`;
            meta.properties.forEach(p => {
              tblP.innerHTML += `<tr><td>${p.name}</td><td>${p.data_type}</td></tr>`;
            });
            content.appendChild(document.createElement('br'));
            const h5P = document.createElement('h5');
            h5P.textContent = 'Properties:';
            content.appendChild(h5P);
            content.appendChild(tblP);
          }

          const ssf = meta.spatialSamplingFeatureType || {};
          const tblS = document.createElement('table');
          tblS.innerHTML = '<tr><th>Field</th><th>Value</th></tr>';

          // sampledFeatureType
          if (ssf.sampledFeatureType) {
            const row = document.createElement('tr');
            const tdField = document.createElement('td');
            tdField.textContent = 'sampledFeatureType';
            row.appendChild(tdField);

            const tdValue = document.createElement('td');
            const link = document.createElement('span');
            link.className = 'foi-link';
            link.textContent = ssf.sampledFeatureType;
            link.addEventListener('click', async e => {
              e.stopPropagation();
              // 3.1) Llamada al endpoint de Feature Types
              let featMeta = [];
              try {
                const resp = await fetch(
                  `/api/feature-type-by-name?featureTypeName=${encodeURIComponent(ssf.sampledFeatureType)}`
                );
                featMeta = await resp.json();
              } catch (err) {
                console.error('Error cargando Feature Type:', err);
                return;
              }
              const metaFT = featMeta[0] || {};

              // 3.2) Construimos contenido del modal
              const contentFT = document.createElement('div');

              // Clase
              if (metaFT.class) {
                const pClass = document.createElement('p');
                pClass.textContent = `Class: ${metaFT.class}`;
                contentFT.appendChild(pClass);
              }

              // Nueva parte: mostrar Sampled Feature Type y Supertypes
              const pSFT = document.createElement('p');
              pSFT.textContent = `Sampled Feature Type: ${ssf.sampledFeatureType}`;
              contentFT.appendChild(pSFT);


              if (Array.isArray(metaFT.supertypes) && metaFT.supertypes.length) {
                const pSuper = document.createElement('p');
                pSuper.textContent = `Supertypes: ${metaFT.supertypes.join(', ')}`;
                contentFT.appendChild(pSuper);
              }

              // Contenedor scrollable para la tabla
              const scrollContainer = document.createElement('div');
              scrollContainer.style.maxHeight = '400px';
              scrollContainer.style.overflowY = 'auto';
              scrollContainer.style.marginTop = '1rem';
              scrollContainer.style.border = '1px solid var(--border-color)';
              scrollContainer.style.padding = '0.5rem';
              scrollContainer.style.background = 'var(--primary-light)';
              scrollContainer.style.borderRadius = '4px';

              // Tabla con los campos (fields)
              if (Array.isArray(metaFT.properties) && metaFT.properties.length) {
                const tblFT = document.createElement('table');
                tblFT.style.borderCollapse = 'collapse';
                tblFT.style.width = '100%';
                tblFT.style.fontSize = '0.9rem';

                // Cabecera
                const thead = document.createElement('tr');
                thead.innerHTML = `
                  <th>Name</th>
                  <th>Type</th>
                `;
                tblFT.appendChild(thead);

                // Filas
                metaFT.properties.forEach(p => {
                  const vocab = {};
                  (p.names || []).forEach(n => vocab[n.vocabulary] = n.term);

                  const row = document.createElement('tr');
                  row.innerHTML = `
                    <td>
                      <strong>castellano:</strong><br> ${vocab.castellano || ''}<br/>
                      <strong>galego:</strong><br> ${vocab.galego || ''}<br/>
                      <strong>english:</strong><br> ${vocab.english || ''}<br/>
                    </td>
                    <td>${p.data_type}</td>
                  `;
                  tblFT.appendChild(row);
                });

                contentFT.appendChild(document.createElement('br'));
                const hProps = document.createElement('h5');
                hProps.textContent = 'Properties:';
                contentFT.appendChild(hProps);
                contentFT.appendChild(tblFT);
              }

              showModal(ssf.sampledFeatureType, contentFT);
            });

            tdValue.appendChild(link);
            row.appendChild(tdValue);
            tblS.appendChild(row);
          }

          // shapeCRS
          if (ssf.shapeCRS) {
            const r = document.createElement('tr');
            r.innerHTML = `<td>shapeCRS</td><td>${ssf.shapeCRS}</td>`;
            tblS.appendChild(r);
          }
          // verticalCRS
          if (ssf.verticalCRS) {
            const r = document.createElement('tr');
            r.innerHTML = `<td>verticalCRS</td><td>${ssf.verticalCRS}</td>`;
            tblS.appendChild(r);
          }

          content.appendChild(document.createElement('br'));
          content.appendChild(document.createElement('h5')).textContent = 'Spatial Sampling Feature Type:';
          content.appendChild(tblS);

          showModal(foitype, content);
        });
      }
    }

    // Observation Type
    if (process.observation_type) {
      detail.appendChild(createListSection(
        'Observation Type',
        [{ name: process.observation_type }]
      ));
    }
    
    // Observed Properties
    if (Array.isArray(process.observed_properties)) {
      // 1) Creamos la sección una sola vez
      const obsSection = createListSection(
        'Observed Properties',
        process.observed_properties.map(op => ({
          name: (op.names || []).find(n => n.vocabulary === vocabKey)?.term || op.name,
          code: op.name,      // para detectar el data_type
          type: op.data_type
        }))
      );
      detail.appendChild(obsSection);

      // 2) Recorremos todos los <span class="prop-type"> y, si son namespaced, los convertimos en enlaces
      obsSection.querySelectorAll('span.prop-type').forEach(typeSpan => {
        const dt = typeSpan.textContent;
        // criterio: contenga un punto (namespaced), p.ej. 'ctd_intecmar.flags_validacion', 'roms_meteogalicia.sea_water_velocity', etc.
        if (dt.includes('.')) {
          // aplicamos el mismo estilo que tus .foi-link
          typeSpan.classList.add('foi-link');

          // listener para abrir el modal
          typeSpan.addEventListener('click', async e => {
            e.stopPropagation();

            // 1) Llamamos al endpoint de Data Type
            let dataTypeMeta = [];
            try {
              const resp = await fetch(
                `/api/data-type-by-name?dataTypeName=${encodeURIComponent(dt)}`
              );
              dataTypeMeta = await resp.json();
            } catch (err) {
              console.error('Error cargando Data Type:', err);
              return;
            }
            const meta = dataTypeMeta[0] || {};

            // 2) Construimos contenido del modal
            const content = document.createElement('div');

            // Título: Name del data type
            const h5Type = document.createElement('h5');
            h5Type.textContent = dt;
            content.appendChild(h5Type);

            // Clase (complex, etc.)
            if (meta.class) {
              const pClass = document.createElement('p');
              pClass.textContent = `Class: ${meta.class}`;
              content.appendChild(pClass);
            }

            // Container scrollable para la tabla
            const scrollContainer = document.createElement('div');
            scrollContainer.style.maxHeight = '400px';
            scrollContainer.style.overflowY = 'auto';
            scrollContainer.style.marginTop = '1rem';
            scrollContainer.style.border = '1px solid var(--border-color)';
            scrollContainer.style.padding = '0.5rem';
            scrollContainer.style.background = 'var(--primary-light)';
            scrollContainer.style.borderRadius = '4px';

            // Si trae fields → creamos la tabla
            if (Array.isArray(meta.fields)) {
              const tbl = document.createElement('table');
              tbl.style.borderCollapse = 'collapse';
              tbl.style.width = '100%';
              tbl.style.fontSize = '0.9rem';

              // Cabecera
              const thead = document.createElement('tr');
              thead.innerHTML = `
                <th>Name</th>
                <th>Type</th>
                <th>cf_standard_names</th>
              `;
              tbl.appendChild(thead);

              // Filas
              meta.fields.forEach(field => {
                const vocab = {};
                (field.names || []).forEach(n => vocab[n.vocabulary] = n.term);

                const row = document.createElement('tr');
                row.innerHTML = `
                  <td>
                    <strong>castellano:</strong><br> ${vocab.castellano || ''}<br/>
                    <strong>galego:</strong><br> ${vocab.galego || ''}<br/>
                    <strong>english:</strong><br> ${vocab.english || ''}<br/>
                  </td>
                  <td>${field.data_type}</td>
                  <td>${vocab['cf_standard_names'] || ''}</td>
                `;
                tbl.appendChild(row);
              });

              scrollContainer.appendChild(tbl);
              content.appendChild(scrollContainer);
            }

            // 3) Mostrar modal
            showModal(dt, content);
          });
        }
      });

      // 3) Convertir el nombre en un enlace que abre un ventana
      obsSection.querySelectorAll('li').forEach(li => {
        if (li.dataset.code === 'ctd_intecmar.flags_validacion') {
          const nameSpan = li.querySelector('span.prop-name');
          if (!nameSpan) return;

          const link = document.createElement('span');
          link.className = 'foi-link';
          link.textContent = nameSpan.textContent;
          link.style.cursor = 'pointer';
          link.style.color = 'var(--primary-color)';
          link.style.textDecoration = 'underline';

          link.addEventListener('click', ev => {
            ev.stopPropagation();
            // Extraemos el array completo
            const obsProps = process.observed_properties;

            // Construimos el contenido del modal
            const content = document.createElement('div');
            const h5 = document.createElement('h5');
            h5.textContent = 'Observed Properties JSON';
            content.appendChild(h5);

            const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(obsProps, null, 2);
            pre.style.marginTop = '1rem';
            pre.style.background = 'var(--primary-light)';
            pre.style.border = '1px solid var(--border-color)';
            pre.style.padding = '0.75rem';
            content.appendChild(pre);

            showModal('ctd_intecmar.flags_validacion', content);
          });

          // Reemplazamos el nombre original por nuestro enlace
          nameSpan.parentNode.replaceChild(link, nameSpan);
        }
      });
    }

    section.appendChild(detail);
    header.addEventListener('click', () => {
      detail.classList.toggle('hidden');
      section.classList.toggle('open');
    });

    container.appendChild(section);
  }
}

/**
 * Observador para pintar JSON crudo → renderResults
 */
function initResultObserver() {
  const disp = document.getElementById('resultDisplay');
  const obs = new MutationObserver(muts => {
    muts.forEach(m => {
      if (['childList','characterData'].includes(m.type)) {
        try {
          renderResults(JSON.parse(disp.textContent));
        } catch {}
      }
    });
  });
  obs.observe(disp, { childList: true, subtree: true, characterData: true });
}

document.addEventListener('DOMContentLoaded', initResultObserver);
