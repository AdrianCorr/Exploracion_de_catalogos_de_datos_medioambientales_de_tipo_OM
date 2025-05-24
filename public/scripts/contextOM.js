// contextOM.js
// Módulo para filtrar procesos y Features of Interest

document.addEventListener('DOMContentLoaded', () => {
    // Elementos del formulario de filtrado de procesos
    const filterProcessTypeNameInput = document.getElementById('filterProcessTypeName');
    const filterKeywordInput = document.getElementById('filterKeyword');
    const filterStartTimeInput = document.getElementById('filterStartTime');
    const filterEndTimeInput = document.getElementById('filterEndTime');
    const filterProcessButton = document.getElementById('filterProcessBtn');

    // Elementos del formulario de filtrado de Feature of Interest
    const filterFeatureOfInterestNameInput = document.getElementById('featureOfInterestName');
    const filterKeywordFeatureInput = document.getElementById('keywordFilter');
    const filterGeometryFeatureInput = document.getElementById('geometryFilter');
    const filterFeatureButton = document.getElementById('searchFeatureOfInterest');

    // Elementos del formulario de filtrado por ID
    const processByIdTypeNameInput = document.getElementById('processByIdTypeName');
    const processIdInput = document.getElementById('processId');
    const timeFilterInput = document.getElementById('timeFilter');
    const searchProcessByIdButton = document.getElementById('searchProcessByIdBtn');

    // Elemento para mostrar el resultado
    const resultDisplay = document.getElementById('resultDisplay');

    /////////////////////////////////////////////////////////////////////////
    // Función para filtrar procesos según los criterios ingresados
    async function filterProcesses(typeName, keyword, startTime, endTime) {
        if (!typeName) throw new Error('Por favor, introduzca un nombre de tipo de proceso.');
        let url = `/api/filter-process?processTypeName=${encodeURIComponent(typeName)}`;
        if (keyword) url += `&keywordFilter=${encodeURIComponent(keyword)}`;
        if (startTime) url += `&startTime=${encodeURIComponent(startTime)}`;
        if (endTime) url += `&endTime=${encodeURIComponent(endTime)}`;

        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
    }
    window.filterProcesses = filterProcesses;

    /////////////////////////////////////////////////////////////////////////
    // Función para filtrar Feature of Interest según los criterios ingresados
    async function filterFeatureOfInterest(featureTypeName) {
        if (!featureTypeName) return [];
        const url = `/api/filter-feature-of-interest?featureTypeName=${encodeURIComponent(featureTypeName)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
    }
    window.filterFeatureOfInterest = filterFeatureOfInterest;

    // Listeners a botones de formulario para procesos (si aún los usas)
    filterProcessButton?.addEventListener('click', async () => {
        try {
            const data = await filterProcesses(
                filterProcessTypeNameInput.value.trim(),
                filterKeywordInput.value.trim(),
                filterStartTimeInput.value.trim(),
                filterEndTimeInput.value.trim()
            );
            window.renderResults?.(data);
        } catch (err) {
            resultDisplay.textContent = err.message;
        }
    });

    /////////////////////////////////////////////////////////////////////////
    // Función para filtrar procesos por ID
    async function ProcessById() {
        const processTypeName = processByIdTypeNameInput.value.trim();
        const processId = processIdInput.value.trim();
        const timeFilter = timeFilterInput.value.trim();

        if (!processTypeName) {
            resultDisplay.textContent = 'Por favor, introduzca un nombre de tipo de proceso.';
            return;
        }

        let url = `/api/process-by-id?processTypeName=${encodeURIComponent(processTypeName)}&id=${encodeURIComponent(processId)}`;
        if (timeFilter) url += `&timeFilter=${encodeURIComponent(timeFilter)}`;

        try {
            const resp = await fetch(url);
            const data = await resp.json();
            resultDisplay.textContent = JSON.stringify(data, null, 2);
            return data;
        } catch (error) {
            resultDisplay.textContent = `Error: ${error.message}`;
            console.error(error);
            throw error;
        }
    }

    /////////////////////////////////////////////////////////////////////////
    // Función para buscar Feature of Interest por ID
    async function featureOfInterestById() {
        const featureTypeName = document.getElementById('featureTypeNameFOI').value.trim();
        const fid = document.getElementById('fid').value.trim();

        if (!featureTypeName || !fid) {
            resultDisplay.textContent = 'Por favor, introduzca el nombre del Feature Type y su ID.';
            return;
        }

        const url = `/api/feature-of-interest-by-id?featureTypeName=${encodeURIComponent(featureTypeName)}&fid=${encodeURIComponent(fid)}`;
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            resultDisplay.textContent = JSON.stringify(data, null, 2);
            return data;
        } catch (error) {
            resultDisplay.textContent = `Error: ${error.message}`;
            console.error(error);
            throw error;
        }
    }
    window.featureOfInterestById = featureOfInterestById;


    /////////////////////////////////////////////////////////////////////////
    // Función para obtener la metadata de un Feature Type (spatialSamplingFeatureType)
    async function fetchFeatureType(featureTypeName) {
        const url = `/api/feature-type-by-name?featureTypeName=${encodeURIComponent(featureTypeName)}`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
    }
    window.fetchFeatureType = fetchFeatureType;

    // Listeners
    filterProcessButton.addEventListener('click', filterProcesses);
    filterFeatureButton.addEventListener('click', filterFeatureOfInterest);
    searchProcessByIdButton.addEventListener('click', ProcessById);
    document.getElementById('searchFeatureByIdBtn').addEventListener('click', featureOfInterestById);
});