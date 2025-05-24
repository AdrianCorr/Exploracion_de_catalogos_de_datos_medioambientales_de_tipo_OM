# Proyecto ccmm-proxy

Este proyecto es un servidor proxy basado en Node.js que utiliza Express para manejar solicitudes HTTP y realizar peticiones a una API externa.

## Pasos para ponerlo en marcha

### Paso 1: Requisitos previos
Antes de comenzar, necesitarás tener instalado:
- **Node.js**: Descárgalo e instálalo desde [nodejs.org](https://nodejs.org/)
- **Editor de código**: Recomiendo [Visual Studio Code](https://code.visualstudio.com/)

### Paso 2: Configuración del proyecto
1. **Crea una carpeta para el proyecto:**
   - Crea una carpeta llamada "EjemploAPI" en tu escritorio, por ejemplo.
   - Dentro de esta carpeta, crea otra llamada "public".
2. **Copia los archivos:**
   - `server.js` (en la carpeta principal).
   - `package.json` (en la carpeta principal).
   - `index.html` (en la carpeta `public`).

### Paso 3: Instalación de dependencias
1. **Abre una terminal o línea de comandos.**
2. **Navega hasta la carpeta del proyecto:**
   ```sh
   cd c:\Users\TuNombreDeUsuario\Desktop\EjemploAPI
   ```
3. **Instala las dependencias ejecutando:**
   ```sh
   npm install
   ```
   Este comando instalará las bibliotecas necesarias (`express`, `node-fetch` y `cors`) definidas en el archivo `package.json`.

### Paso 4: Ejecutar el servidor
Una vez terminada la instalación, inicia el servidor con:
```sh
node server.js
```
Deberías ver en la terminal el mensaje:
```
http://localhost:3000
```

### Paso 5: Usar la aplicación
1. **Abre un navegador y ve a la dirección:**
   ```
http://localhost:3000
   ```
2. **Interfaz de usuario:**
   - Selecciona un `vocabulary` (ES, GL o EN).
   - Escribe un término de búsqueda en el campo de texto: modelo, barco, etc.
   - Haz clic en el botón "Buscar".
   - Verás los resultados en la sección inferior.

## Explicación básica del código

- **`server.js`**: Crea un servidor web que sirve la página HTML y actúa como intermediario (proxy) para hacer peticiones a una API externa protegida con contraseña.
- **`index.html`**: Contiene la interfaz de usuario con HTML, CSS y JavaScript.
- **`package.json`**: Define las dependencias del proyecto y permite gestionar el entorno.

## Funcionamiento del `package.json`

El archivo `package.json` es un elemento clave del proyecto, ya que define las dependencias y configuraciones del mismo. Su contenido principal es:

```json
{
  "name": "ccmm-proxy",         // Nombre del proyecto
  "version": "1.0.0",           // Versión del proyecto
  "main": "server.js",         // Archivo principal que se ejecutará al iniciar el servidor
  "dependencies": {              // Lista de paquetes necesarios para el proyecto
    "express": "^4.18.2",      // Framework para el servidor web
    "node-fetch": "^2.6.9",    // Librería para realizar peticiones HTTP desde Node.js
    "cors": "^2.8.5"           // Middleware para permitir solicitudes desde diferentes dominios (CORS)
  }
}
```

### Elementos clave del `package.json`
1. **`name` y `version`**: Identifican el proyecto y su versión actual.
2. **`main`**: Define el archivo de entrada principal del proyecto (`server.js`).
3. **`dependencies`**: Especifica los módulos necesarios para que el servidor funcione correctamente.

Cuando se ejecuta `npm install`, Node.js descarga e instala automáticamente las dependencias listadas en este archivo dentro de la carpeta `node_modules`.

## ¿Cómo funciona la aplicación?
1. El usuario introduce un término y pulsa "Buscar".
2. El navegador envía una petición al servidor local.
3. El servidor reenvía la petición a la API externa.
4. La API externa responde con los datos.
5. El servidor devuelve los datos al navegador y los muestra en pantalla.

