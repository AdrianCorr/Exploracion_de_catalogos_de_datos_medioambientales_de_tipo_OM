const express = require("express"); // Importa el framework Express para crear el servidor web
const fetch = require("node-fetch"); // Importa node-fetch para realizar solicitudes HTTP
const cors = require("cors"); // Importa CORS para permitir solicitudes desde otros dominios
const path = require("path"); // Importa path para manejar rutas de archivos y directorios


const app = express(); // Crea una instancia de la aplicación Express


app.use(cors()); // Habilita CORS para permitir peticiones desde cualquier origen


// Configura las credenciales de autorización en Base64 para las solicitudes a la API externa
const AUTH_HEADER = {
  Authorization: "Basic " + Buffer.from("ccmm:ccmm2024").toString("base64")
}; 


// Configura la política de seguridad de contenido (CSP) para permitir Leaflet y Leaflet Draw desde CDN
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      // 1) default-src 'self' → todo lo que no esté explicitado
      "default-src 'self';",

      // 2) font-src: permitimos fuentes locales y datos embebidos (ej. Data URLs)
      "font-src 'self' data:;",

      // 3) style-src:
      //    - 'self'       → tus propios CSS (base.css, components.css, view.css, filter.css…)
      //    - 'unsafe-inline' → si tienes <style> inline o necesitas permitir ciertos estilos inline
      //    - https://unpkg.com        → para leaflet.css
      //    - https://cdnjs.cloudflare.com → para leaflet.draw.css
      //    - http://maxcdn.bootstrapcdn.com → para font-awesome
      "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com http://maxcdn.bootstrapcdn.com;",

      // 4) script-src:
      //    - 'self'       → tus propios JS (main.js, filter.js, view.js…)
      //    - 'unsafe-inline' → si usas <script> inline o event handlers en línea (por ejemplo onsubmit="…")
      //    - https://unpkg.com        → leaflet.js
      //    - https://cdnjs.cloudflare.com → leaflet.draw.js
      //    - http://maxcdn.bootstrapcdn.com → font-awesome (solo CSS, pero por si acaso)
      "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com http://maxcdn.bootstrapcdn.com;",

      // 5) img-src: si usas íconos o marcadores externos (puedes agregar dominios aquí si hiciera falta)
      //    - 'self'  → imágenes locales
      //    - data:   → marcadores en base64
      "img-src 'self' data:;",

      // 6) connect-src: si más adelante haces fetch() a otros orígenes
      "connect-src 'self';",

      // 7) object-src: negar objetos externos
      "object-src 'none';",

      // 8) base-uri: evitar que <base> cambie el origen
      "base-uri 'self';",

      // 9) frame-ancestors: evitar clickjacking
      "frame-ancestors 'none';",
    ].join(" ")
  );
  next();
});



// Sirve archivos estáticos desde la carpeta "public"
app.use(express.static(path.join(__dirname, "public")));


// Ruta principal que sirve el archivo index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


////////////////////////////////////////////////////////////////////////////
// Ruta API para obtener tipos de procesos desde una API externa
app.get("/api/process-types", async (req, res) => {
  const { vocabulary, searchTerm } = req.query; // Obtiene los parámetros 'vocabulary' y 'searchTerm' de la URL

  try {
    const response = await fetch(
      `https://tec.citius.usc.es/ccmm/api/process-types?vocabulary=${vocabulary}&searchTerm=${searchTerm}`,
      { headers: AUTH_HEADER }
    );

    const data = await response.json(); // Convierte la respuesta en JSON
    res.json(data); // Devuelve los datos obtenidos como respuesta
  } catch (error) {
    res.status(500).json({ error: error.message }); // Manejo de errores en caso de fallo en la solicitud
  }
});


////////////////////////////////////////////////////////////////////////////
// Nueva ruta API para obtener un tipo de dato por nombre
app.get("/api/data-type-by-name", async (req, res) => {
  const dataTypeName = req.query.dataTypeName; // Obtiene el parámetro 'dataTypeName' de la URL

  if (!dataTypeName) {
    return res.status(400).json({ error: "El parámetro 'dataTypeName' es requerido." });
  }

  try {
    const response = await fetch(
      `https://tec.citius.usc.es/ccmm/api/data-type-by-name?dataTypeName=${encodeURIComponent(dataTypeName)}`,
      { headers: AUTH_HEADER }
    );

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json(); // Convierte la respuesta en JSON
    res.json(data); // Devuelve los datos obtenidos como respuesta
  } catch (error) {
    res.status(500).json({ error: error.message }); // Manejo de errores en caso de fallo en la solicitud
  }
});


////////////////////////////////////////////////////////////////////////////
// Nueva ruta API para obtener un tipo de dato por nombre
app.get("/api/feature-type-by-name", async (req, res) => {
  const featureTypeName = req.query.featureTypeName; // Obtiene el parámetro 'featureTypeName' de la URL

  if (!featureTypeName) {
    return res.status(400).json({ error: "El parámetro 'featureTypeName' es requerido." });
  }

  try {
    const response = await fetch(
      `https://tec.citius.usc.es/ccmm/api/feature-type-by-name?featureTypeName=${encodeURIComponent(featureTypeName)}`,
      { headers: AUTH_HEADER }
    );

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json(); // Convierte la respuesta en JSON
    res.json(data); // Devuelve los datos obtenidos como respuesta
  } catch (error) {
    res.status(500).json({ error: error.message }); // Manejo de errores en caso de fallo en la solicitud
  }
});


////////////////////////////////////////////////////////////////////////////
// Filtrar procesos según criterios
app.get("/api/filter-process", async (req, res) => {
  const { processTypeName, keywordFilter, startTime, endTime } = req.query;

  if (!processTypeName) {
    return res.status(400).json({ error: "El parámetro 'processTypeName' es requerido." });
  }

  const url = new URL("https://tec.citius.usc.es/ccmm/api/filter-process");
  url.searchParams.append("processTypeName", processTypeName);
  if (keywordFilter) url.searchParams.append("keywordFilter", keywordFilter);
  if (startTime) url.searchParams.append("startTime", startTime);
  if (endTime) url.searchParams.append("endTime", endTime);

  try {
    const response = await fetch(url.toString(), {
      headers: AUTH_HEADER
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


////////////////////////////////////////////////////////////////////////////
// Nueva ruta API para filtrar Feature Types mediante criterios
app.get("/api/filter-feature-of-interest", async (req, res) => {
  const { featureTypeName, keywordFilter, geometryFilter } = req.query; // Obtiene los parámetros 'featureTypeName', 'keywordFilter' y 'geometryFilter' de la URL

  if (!featureTypeName) {
    return res.status(400).json({ error: "El parámetro 'featureTypeName' es requerido." });
  }

  const url = new URL("https://tec.citius.usc.es/ccmm/api/filter-feature-of-interest");
  url.searchParams.append("featureTypeName", featureTypeName);
  if (keywordFilter) url.searchParams.append("keywordFilter", keywordFilter);
  if (geometryFilter) url.searchParams.append("geometryFilter", geometryFilter);

  try {
    const response = await fetch(url.toString(), {
      headers: AUTH_HEADER, // Autenticación en base64
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json(); // Convierte la respuesta en JSON
    res.json(data); // Devuelve los datos obtenidos como respuesta
  } catch (error) {
    res.status(500).json({ error: error.message }); // Manejo de errores en caso de fallo en la solicitud
  }
});


////////////////////////////////////////////////////////////////////////////
// Ruta API para obtener un proceso por ID
app.get("/api/process-by-id", async (req, res) => {
  const { processTypeName, id, timeFilter } = req.query;

  if (!processTypeName || !id) {
    return res.status(400).json({ error: "Los parámetros 'processTypeName' e 'id' son requeridos." });
  }

  const url = new URL("https://tec.citius.usc.es/ccmm/api/process-by-id");
  url.searchParams.append("processTypeName", processTypeName);
  url.searchParams.append("id", id);
  if (timeFilter) url.searchParams.append("timeFilter", timeFilter);

  try {
    const response = await fetch(url.toString(), {
      headers: AUTH_HEADER
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


////////////////////////////////////////////////////////////////////////////
// Ruta API para obtener un Feature of Interest por su ID
app.get("/api/feature-of-interest-by-id", async (req, res) => {
  const { featureTypeName, fid } = req.query;

  if (!featureTypeName || !fid) {
    return res.status(400).json({ error: "Los parámetros 'featureTypeName' y 'fid' son requeridos." });
  }

  const url = new URL("https://tec.citius.usc.es/ccmm/api/feature-of-interest-by-id");
  url.searchParams.append("featureTypeName", featureTypeName);
  url.searchParams.append("fid", fid);

  try {
    const response = await fetch(url.toString(), {
      headers: AUTH_HEADER
    });

    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


////////////////////////////////////////////////////////////////////////////
// Inicia el servidor en el puerto 3000
app.listen(3000, () => {
  console.log("http://localhost:3000"); // Muestra la URL en la consola cuando el servidor arranca
});
