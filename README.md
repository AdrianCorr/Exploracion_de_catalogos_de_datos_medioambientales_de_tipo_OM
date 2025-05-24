# Exploración de catálogos de datos medioambientales de tipo O&M

Este proyecto es el resultado de un **Trabajo de Fin de Grado (TFG)** que tiene como objetivo el desarrollo de un **cliente web genérico** para la exploración de conjuntos de datos medioambientales. Está basado en el modelo **Observations and Measurements (O&M)** del Open Geospatial Consortium (OGC) y permite la interacción con una **API externa** mediante un servidor intermedio en Node.js.

## 🌐 Descripción

La aplicación ofrece una interfaz web que permite:

- Descubrir catálogos y conjuntos de datos medioambientales disponibles.
- Navegar por sus dimensiones temporales y espaciales.
- Visualizar los datos en un **mapa interactivo** usando Leaflet.
- Filtrar resultados y explorar metadatos clave.

## 🛠️ Tecnologías utilizadas

- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Node.js con Express  
- **Librerías**:
  - `express`: para el servidor web
  - `node-fetch`: para hacer peticiones a la API externa
  - `cors`: para manejar políticas de acceso cruzado
  - `Leaflet`: para visualización geoespacial interactiva en mapas

## 🚀 Ejecución del proyecto

1. Clona este repositorio:
   ```bash
   git clone https://github.com/AdrianCorr/Exploracion_de_catalogos_de_datos_medioambientales_de_tipo_OM.git
   ```
2. Entra en el directorio del proyecto:
```bash
cd Exploracion_de_catalogos_de_datos_medioambientales_de_tipo_OM
```
5. Instala las dependencias necesarias:
```bash
npm install
```
7. Ejecuta el servidor:
```bash
node server.js
```
8. Abre tu navegador y accede a:
```bash
http://localhost:3000
```

## Estructura del proyecto
La estructura del proyecto está organizada en torno a un servidor Node.js y archivos web dentro de la carpeta public. El código JavaScript está modularizado en distintos archivos dentro de public/scripts.

   ⚠️ La estructura puede estar sujeta a cambios durante el desarrollo.

## Licencia

Este proyecto se distribuye con fines académicos como parte de un Trabajo de Fin de Grado. Su uso está limitado a propósitos educativos y de investigación.

## Autor

Adrián Correa Miguel
Trabajo de Fin de Grado - Universidad de Santiago de Compostela
2025
