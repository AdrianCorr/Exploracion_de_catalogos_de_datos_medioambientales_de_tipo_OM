document.addEventListener('DOMContentLoaded', () => {
    const vocabularySelect = document.getElementById('vocabulary');
    const searchTermInput = document.getElementById('searchTerm');
    const searchProcessButton = document.getElementById('searchProcess');

    const dataTypeInput = document.getElementById('dataTypeName');
    const searchFeatureTypeInput = document.getElementById('featureTypeName');
    const resultDisplay = document.getElementById('resultDisplay');


    /////////////////////////////////////////////////////////////////////////
    // Función para buscar procesos
    function searchProcesses() {
        const vocabulary = vocabularySelect.value;
        const searchTerm = searchTermInput.value.trim();

        fetch(`/api/process-types?vocabulary=${vocabulary}&searchTerm=${searchTerm}`)
            .then(response => response.json())
            .then(data => {
                resultDisplay.textContent = JSON.stringify(data, null, 2);
            })
            .catch(error => {
                resultDisplay.textContent = `Error: ${error.message}`;
            });
    }

    /////////////////////////////////////////////////////////////////////////
    // Función para buscar tipos de datos según su nombre
    function searchDataTypes() {
        const dataTypeName = dataTypeInput.value.trim();
    
        if (!dataTypeName) {
            resultDisplay.textContent = 'Por favor, introduzca un nombre de tipo de dato.';
            return;
        }
    
        fetch(`/api/data-type-by-name?dataTypeName=${dataTypeName}`)
            .then(response => response.json())
            .then(data => {
                resultDisplay.textContent = JSON.stringify(data, null, 2);
            })
            .catch(error => {
                resultDisplay.textContent = `Error: ${error.message}`;
            });
    }    

    /////////////////////////////////////////////////////////////////////////
    // Función para buscar Feature Types según su nombre
    function searchFeatureTypes() {
        const featureTypeName = searchFeatureTypeInput.value.trim();
    
        if (!featureTypeName) {
            resultDisplay.textContent = 'Por favor, introduzca un nombre de Feature Type.';
            return;
        }
    
        fetch(`/api/feature-type-by-name?featureTypeName=${featureTypeName}`)
            .then(response => response.json())
            .then(data => {
                resultDisplay.textContent = JSON.stringify(data, null, 2);
            })
            .catch(error => {
                resultDisplay.textContent = `Error: ${error.message}`;
            });
    }    


    // Agregar los event listeners a los botones
    searchProcessButton.addEventListener('click', searchProcesses);
});
