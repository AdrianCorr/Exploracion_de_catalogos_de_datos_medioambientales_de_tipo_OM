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
      foiLink.style.cursor = 'pointer';
      foiLink.style.color = 'var(--primary-color)';
      foiLink.style.textDecoration = 'underline';

      foiContainer.appendChild(foiLink);
      detail.appendChild(foiContainer);

      foiLink.addEventListener('click', async event => {
        event.stopPropagation();

        // 1) Instancia FOI
        let inst = {};
        try {
          const list = await window.filterFeatureOfInterest(process.feature_of_interest_type);
          inst = list[0] || {};
        } catch (e) {
          console.warn('Error inst FOI:', e);
        }

        // 2) Metadata de tipo FOI
        let metaArr = [];
        try {
          metaArr = await window.fetchFeatureType(process.feature_of_interest_type);
        } catch (e) {
          console.warn('Error meta FOI:', e);
        }
        const meta = Array.isArray(metaArr) ? metaArr[0] : {};

        // Construir contenido del modal
        const content = document.createElement('div');

        // Feature Type
        const hType = document.createElement('h5');
        hType.textContent = `Feature Type: ${process.feature_of_interest_type}`;
        content.appendChild(hType);

        // Properties (metadata)
        if (Array.isArray(meta.properties)) {
          const tblP = document.createElement('table');
          tblP.innerHTML = '<tr><th>Name</th><th>Type</th></tr>';
          meta.properties.forEach(p => {
            tblP.innerHTML += `<tr><td>${p.name}</td><td>${p.data_type}</td></tr>`;
          });
          content.appendChild(document.createElement('br'));
          content.appendChild(document.createElement('h5')).textContent = 'Properties:';
          content.appendChild(tblP);
        }

        // Spatial Sampling Feature Type
        const ssf = meta.spatialSamplingFeatureType || {};
        const tblS = document.createElement('table');
        tblS.innerHTML = '<tr><th>Field</th><th>Value</th></tr>';
        if (ssf.sampledFeatureType) {
          tblS.innerHTML += `<tr><td>sampledFeatureType</td><td>${ssf.sampledFeatureType}</td></tr>`;
        }
        if (ssf.shapeCRS) {
          tblS.innerHTML += `<tr><td>shapeCRS</td><td>${ssf.shapeCRS}</td></tr>`;
        }
        if (ssf.verticalCRS) {
          tblS.innerHTML += `<tr><td>verticalCRS</td><td>${ssf.verticalCRS}</td></tr>`;
        }
        content.appendChild(document.createElement('br'));
        content.appendChild(document.createElement('h5')).textContent = 'Spatial Sampling Feature Type:';
        content.appendChild(tblS);

        showModal(process.feature_of_interest_type, content);
      });
    }

    // Observation Type
    if (process.observation_type) {
      detail.appendChild(createListSection(
        'Observation Type',
        [{ name: process.observation_type }]
      ));
    }
    
    // Observed Properties (con validación y debug JSON)
    if (Array.isArray(process.observed_properties)) {
      // 1) Creamos la sección UNA sola vez
      const obsSection = createListSection(
        'Observed Properties',
        process.observed_properties.map(op => ({
          name: (op.names || []).find(n => n.vocabulary === vocabKey)?.term || op.name,
          code: op.name,      // para detectar flags_validacion
          type: op.data_type
        }))
      );
      detail.appendChild(obsSection);

      // 2) Resaltar el type y enlazar la búsqueda
      obsSection.querySelectorAll('span.prop-type').forEach(typeSpan => {
        if (typeSpan.textContent === 'ctd_intecmar.flags_validacion') {
          // — resaltado en azul tal como antes —
          typeSpan.classList.add('foi-link');


          // — nueva lógica para abrir modal igual que FOI —
          typeSpan.addEventListener('click', async e => {
            e.stopPropagation();
            const typeName = typeSpan.textContent;

            // 2.1) Llamamos al endpoint de Data Type
            let dataTypeMeta = {};
            try {
              const resp = await fetch(
                `/api/data-type-by-name?dataTypeName=${encodeURIComponent(typeName)}`
              );
              dataTypeMeta = await resp.json();
            } catch (err) {
              console.error('Error cargando Data Type:', err);
            }

            // 2.2) Construimos contenido del modal
            const content = document.createElement('div');

            // Título con nombre del tipo
            const h5Type = document.createElement('h5');
            h5Type.textContent = dataTypeMeta[0]?.name || typeName;
            content.appendChild(h5Type);

            // Clase (complex, etc.)
            const pClass = document.createElement('p');
            pClass.textContent = `Class: ${dataTypeMeta[0]?.class || 'unknown'}`;
            content.appendChild(pClass);

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
            if (Array.isArray(dataTypeMeta[0]?.fields)) {
              const tbl = document.createElement('table');
              tbl.style.borderCollapse = 'collapse';
              tbl.style.width = '100%';
              tbl.style.fontSize = '0.9rem';

              const thead = document.createElement('tr');
              thead.innerHTML = `
                <th>Name</th>
                <th>Type</th>
                <th>Repeated</th>
                <th>castellano</th>
                <th>galego</th>
                <th>english</th>
                <th>cf_standard_names</th>
              `;
              tbl.appendChild(thead);

              dataTypeMeta[0].fields.forEach(field => {
                const row = document.createElement('tr');
                const vocab = {};
                (field.names || []).forEach(n => vocab[n.vocabulary] = n.term);

                row.innerHTML = `
                  <td>${field.name}</td>
                  <td>${field.data_type}</td>
                  <td>${field.repeated ? 'Sí' : 'No'}</td>
                  <td>${vocab.castellano || ''}</td>
                  <td>${vocab.galego || ''}</td>
                  <td>${vocab.english || ''}</td>
                  <td>${vocab['cf_standard_names'] || ''}</td>
                `;
                tbl.appendChild(row);
              });

              scrollContainer.appendChild(tbl);
              content.appendChild(scrollContainer);
            }


            // Si quieres mostrar el JSON completo al final, descomenta esto:
            /*const pre = document.createElement('pre');
            pre.textContent = JSON.stringify(dataTypeMeta, null, 2);
            pre.style.marginTop = '1rem';
            pre.style.background = 'var(--primary-light)';
            pre.style.border = '1px solid var(--border-color)';
            pre.style.padding = '0.75rem';
            pre.style.maxHeight = '400px';
            pre.style.overflowY = 'auto';
            pre.style.fontSize = '0.85rem';
            content.appendChild(pre);*/

            // 2.3) Mostramos el modal
            showModal(typeName, content);
          });
        }
      });

      // 3) Convertir el nombre en enlace que abre el modal con TODO el JSON
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

    // ——— Velocidad de la corriente del agua del mar para roms_meteogalicia.modelo_roms ———
    if (process.name === 'roms_meteogalicia.modelo_roms') {
      const velContainer = document.createElement('div');
      const hVel = document.createElement('h4');
      hVel.textContent = 'Velocidad de la corriente del agua del mar';
      velContainer.appendChild(hVel);

      const velLink = document.createElement('span');
      velLink.className = 'foi-link';
      velLink.textContent = 'roms_meteogalicia.sea_water_velocity';
      velContainer.appendChild(velLink);
      detail.appendChild(velContainer);

      velLink.addEventListener('click', async event => {
       event.stopPropagation();
       const title = velLink.textContent;

       let inst = {};
       try {
         inst = (await window.filterFeatureOfInterest(title))[0] || {};
       } catch (err) {
         console.warn('Error cargando instancia FOI:', err);
       }

       const content = document.createElement('div');
       const pre = document.createElement('pre');
       pre.textContent = JSON.stringify(inst, null, 2);
       content.appendChild(pre);
       showModal(title, content);
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
