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

        // Feature of Interest (DEBAJO de Supertypes)
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

    // Observed Properties
    if (Array.isArray(process.observed_properties)) {
      detail.appendChild(createListSection(
        'Observed Properties',
        process.observed_properties.map(op => ({
          name: (op.names || []).find(n => n.vocabulary === vocabKey)?.term || op.name,
          code: op.name,             // <— guardamos el código original
          type: op.data_type
        }))
      ));
      detail.appendChild(createListSection(
        'Observed Properties',
        process.observed_properties.map(op => ({
          name: (op.names || []).find(n => n.vocabulary === vocabKey)?.term || op.name,
          code: op.name,             // <— guardamos el código original
          type: op.data_type
        }))
      ));
    }

    // —— INSERCIÓN: convertir ctd_intecmar.flags_validacion y roms_meteogalicia.sea_water_velocity en enlaces —— 
    detail.querySelectorAll('ul li').forEach(li => {
      const code = li.dataset.code;
      if (code === 'ctd_intecmar.flags_validacion' || code === 'roms_meteogalicia.sea_water_velocity') {
        // Creamos el <span> enlace
        const span = document.createElement('span');
        span.className = 'foi-link';
        span.textContent = li.textContent; // el texto ya pintado
        span.style.cursor = 'pointer';
        span.style.color = 'var(--primary-color)';
        span.style.textDecoration = 'underline';

        span.addEventListener('click', async e => {
          e.stopPropagation();
          const title = code;
          let metaArr = [];
          try { metaArr = await window.fetchFeatureType(title); }
          catch (err) { console.warn(err); }
          const meta = Array.isArray(metaArr) ? metaArr[0] : {};

          const content = document.createElement('div');
          content.appendChild(Object.assign(document.createElement('h5'), {
            textContent: `Feature Type: ${title}`
          }));

          // Properties
          if (Array.isArray(meta.properties)) {
            const tbl = document.createElement('table');
            tbl.innerHTML = '<tr><th>Name</th><th>Type</th></tr>';
            meta.properties.forEach(p => {
              tbl.innerHTML += `<tr><td>${p.name}</td><td>${p.data_type}</td></tr>`;
            });
            content.appendChild(Object.assign(document.createElement('h5'), {
              textContent: 'Properties:'
            }));
            content.appendChild(tbl);
          }

          // SSF
          const ssf = meta.spatialSamplingFeatureType || {};
          const tblS = document.createElement('table');
          tblS.innerHTML = '<tr><th>Field</th><th>Value</th></tr>';
          ['sampledFeatureType','shapeCRS','verticalCRS'].forEach(k => {
            if (ssf[k]) tblS.innerHTML += `<tr><td>${k}</td><td>${ssf[k]}</td></tr>`;
          });
          content.appendChild(Object.assign(document.createElement('h5'), {
            textContent: 'Spatial Sampling Feature Type:'
          }));
          content.appendChild(tblS);

          showModal(title, content);
        });

        // Reemplazamos el nodo de texto original por el enlace
        li.textContent = '';         // vaciamos
        li.appendChild(span);        // metemos el enlace
      }
    });
    

    // ——— Validación para ctd_intecmar.configuracion_ctd ———
    if (process.name === 'ctd_intecmar.configuracion_ctd') {
      const valContainer = document.createElement('div');
      const hVal = document.createElement('h4');
      hVal.textContent = 'Validación';
      valContainer.appendChild(hVal);

      const valLink = document.createElement('span');
      valLink.className = 'foi-link';
      valLink.textContent = 'ctd_intecmar.flags_validacion';
      valContainer.appendChild(valLink);
      detail.appendChild(valContainer);

      valLink.addEventListener('click', async e => {
        /*event.stopPropagation();
        const title = valLink.textContent;
        // Reusar tu lógica de modal
        let inst = {}, metaArr = [];
        try { inst = (await window.filterFeatureOfInterest(title))[0] || {}; }
        catch(e){ console.warn(e); }
        try { metaArr = await window.fetchFeatureType(title); }
        catch(e){ console.warn(e); }
        const meta = Array.isArray(metaArr) ? metaArr[0] : {};

        const content = document.createElement('div');
        content.appendChild(Object.assign(document.createElement('h5'), { textContent: `Feature Type: ${title}` }));

        if (Array.isArray(meta.properties)) {
          const tbl = document.createElement('table');
          tbl.innerHTML = '<tr><th>Name</th><th>Type</th></tr>';
          meta.properties.forEach(p => tbl.innerHTML += `<tr><td>${p.name}</td><td>${p.data_type}</td></tr>`);
          content.appendChild(Object.assign(document.createElement('h5'), { textContent: 'Properties:' }));
          content.appendChild(tbl);
        }
        const ssf = meta.spatialSamplingFeatureType || {};
        const tblS = document.createElement('table');
        tblS.innerHTML = '<tr><th>Field</th><th>Value</th></tr>';
        ['sampledFeatureType','shapeCRS','verticalCRS'].forEach(k => {
          if (ssf[k]) tblS.innerHTML += `<tr><td>${k}</td><td>${ssf[k]}</td></tr>`;
        });
        content.appendChild(Object.assign(document.createElement('h5'), { textContent: 'Spatial Sampling Feature Type:' }));
        content.appendChild(tblS);

        showModal(title, content);*/
        e.stopPropagation();
        const title = code;
        let inst = {};
        try {
          inst = (await window.filterFeatureOfInterest(title))[0] || {};
        } catch (err) {
          console.warn(err);
        }
        // ——— A partir de aquí: muestra raw JSON en modal ———
        const content = document.createElement('div');
        const pre = document.createElement('pre');
        pre.textContent = JSON.stringify(inst, null, 2);
        content.appendChild(pre);
        showModal(title, content);
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
        let inst = {}, metaArr = [];
        try { inst = (await window.filterFeatureOfInterest(title))[0] || {}; }
        catch(e){ console.warn(e); }
        try { metaArr = await window.fetchFeatureType(title); }
        catch(e){ console.warn(e); }
        const meta = Array.isArray(metaArr) ? metaArr[0] : {};

        const content = document.createElement('div');
        content.appendChild(Object.assign(document.createElement('h5'), { textContent: `Feature Type: ${title}` }));

        if (Array.isArray(meta.properties)) {
          const tbl = document.createElement('table');
          tbl.innerHTML = '<tr><th>Name</th><th>Type</th></tr>';
          meta.properties.forEach(p => tbl.innerHTML += `<tr><td>${p.name}</td><td>${p.data_type}</td></tr>`);
          content.appendChild(Object.assign(document.createElement('h5'), { textContent: 'Properties:' }));
          content.appendChild(tbl);
        }
        const ssf = meta.spatialSamplingFeatureType || {};
        const tblS = document.createElement('table');
        tblS.innerHTML = '<tr><th>Field</th><th>Value</th></tr>';
        ['sampledFeatureType','shapeCRS','verticalCRS'].forEach(k => {
          if (ssf[k]) tblS.innerHTML += `<tr><td>${k}</td><td>${ssf[k]}</td></tr>`;
        });
        content.appendChild(Object.assign(document.createElement('h5'), { textContent: 'Spatial Sampling Feature Type:' }));
        content.appendChild(tblS);

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
