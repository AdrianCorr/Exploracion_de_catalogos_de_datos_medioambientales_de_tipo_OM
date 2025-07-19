/**
 * Módulos principales:
 * - express: servidor HTTP
 * - node-fetch: cliente HTTP para llamadas a APIs externas
 * - cors: habilita CORS en todas las rutas
 * - path: gestión de rutas de ficheros
 */
const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors");
const path = require("path");

// Crea una instancia de la aplicación Express
const app = express();

// Permitir que nuestro frontend (en otro origen) haga llamadas a esta API
app.use(cors());

// Configura las credenciales de autorización en Base64 para las solicitudes a la API externa
const AUTH_HEADER = {
  Authorization: "Basic " + Buffer.from("ccmm:ccmm2024").toString("base64")
}; 

// Política CSP: permitimos recursos solo de nuestro servidor y de estos CDNs
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self';",
      "font-src 'self' data: https://maxcdn.bootstrapcdn.com;",
      "style-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://maxcdn.bootstrapcdn.com;",
      "script-src 'self' 'unsafe-inline' https://unpkg.com https://cdnjs.cloudflare.com https://maxcdn.bootstrapcdn.com https://cdn.jsdelivr.net;",
      "img-src 'self' data: https://tile.openstreetmap.org https://a.tile.openstreetmap.org https://b.tile.openstreetmap.org https://c.tile.openstreetmap.org https://cdnjs.cloudflare.com https://maxcdn.bootstrapcdn.com https://unpkg.com;",
      "connect-src 'self';",
      "object-src 'none';",
      "base-uri 'self';",
      "frame-ancestors 'none';",
    ].join(" ")
  );
  next();
});

/**
 * Contenido público:
 * - Archivos estáticos en /public
 * - index.html en la raíz
 */
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});


/**
 * GET /api/process-types
 * Proxy a https://tec.citius.usc.es/ccmm/api/process-types
 * Query params:
 *  - vocabulary (string)
 *  - searchTerm (string)
 */
app.get("/api/process-types", async (req, res) => {
  const { vocabulary, searchTerm } = req.query;

  try {
    const response = await fetch(
      `https://tec.citius.usc.es/ccmm/api/process-types?vocabulary=${vocabulary}&searchTerm=${searchTerm}`,
      { headers: AUTH_HEADER }
    );

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/data-type-by-name
 * Proxy a https://tec.citius.usc.es/ccmm/api/data-type-by-name
 * Query params:
 *  - dataTypeName (string)
 */
app.get("/api/data-type-by-name", async (req, res) => {
  const dataTypeName = req.query.dataTypeName;

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

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/feature-type-by-name
 * Proxy a https://tec.citius.usc.es/ccmm/api/feature-type-by-name
 * Query params:
 *  - featureTypeName (string)
 */
app.get("/api/feature-type-by-name", async (req, res) => {
  const featureTypeName = req.query.featureTypeName;

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

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/**
 * GET /api/filter-process
 * Proxy a https://tec.citius.usc.es/ccmm/api/filter-process
 * Query params:
 *  - processTypeName (string)
 *  - keywordFilter (string)
 *  - startTime (string)
 *  - endTime (string)
 */
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


/**
 * GET /api/filter-feature-of-interest
 * Proxy a https://tec.citius.usc.es/ccmm/api/filter-feature-of-interest
 * Query params:
 *  - featureTypeName (string)
 *  - keywordFilter (string)
 *  - geometryFilter (string)
 */
app.get("/api/filter-feature-of-interest", async (req, res) => {
  const { featureTypeName, keywordFilter, geometryFilter } = req.query;

  if (!featureTypeName) {
    return res.status(400).json({ error: "El parámetro 'featureTypeName' es requerido." });
  }

  const url = new URL("https://tec.citius.usc.es/ccmm/api/filter-feature-of-interest");
  url.searchParams.append("featureTypeName", featureTypeName);
  if (keywordFilter) url.searchParams.append("keywordFilter", keywordFilter);
  if (geometryFilter) url.searchParams.append("geometryFilter", geometryFilter);

  try {
    const response = await fetch(url.toString(), {
      headers: AUTH_HEADER,
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


/**
 * GET /api/process-by-id
 * Proxy a https://tec.citius.usc.es/ccmm/api/process-by-id
 * Query params:
 *  - processTypeName (string)
 *  - id (string)
 * - timeFilter (string, opcional)
 */
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


/**
 * GET /api/feature-of-interest-by-id
 * Proxy a https://tec.citius.usc.es/ccmm/api/feature-of-interest-by-id
 * Query params:
 *  - featureTypeName (string)
 *  - fid (string)
 */
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


/**
 * GET /api/geoserver-data
 * Proxy a Geoserver WFS para obtener features filtrados.
 * Query params:
 *  - typeName (string)
 *  - procedure (string)
 *  - startTime (string)
 *  - endTime (string)
 *  - bbox (string)
 */
app.get("/api/geoserver-data", async (req, res) => {
  const { typeName, procedure, startTime, endTime, bbox } = req.query;

  if (!typeName) {
    return res
      .status(400)
      .json({ error: "El parámetro 'typeName' es requerido." });
  }

  // Construye la expresión CQL a partir de los parámetros recibidos
  function buildCqlFilter({ bbox, startTime, endTime, procedure }) {
    const filters = [];

    if (bbox) {
      filters.push(`BBOX(shape, ${bbox})`);
    }
    if (startTime) {
      filters.push(`phenomenon_time >= '${startTime}'`);
    }
    if (endTime) {
      filters.push(`phenomenon_time <= '${endTime}'`);
    }
    if (procedure) {
      const procs = procedure.split(",").map((p) => p.trim());
      if (procs.length > 1) {
        filters.push(`procedure IN (${procs.join(",")})`);
      } else {
        filters.push(`procedure = ${procs[0]}`);
      }
    }

    return filters.length ? filters.join(" AND ") : null;
  }

  const cqlFilter = buildCqlFilter({ bbox, startTime, endTime, procedure });
  const GEOSERVER_WFS_URL = "https://tec.citius.usc.es/ccmm/geoserver/ccmm/ows";

  try {
    // 1. Obtener total real de features (WFS GetFeature?resultType=hits)
    const hitsParams = new URLSearchParams({
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName,
      resultType: "hits",
      ...(cqlFilter && { cql_filter: cqlFilter }),
    });
    const hitsResp = await fetch(`${GEOSERVER_WFS_URL}?${hitsParams}`);
    if (!hitsResp.ok) {
      throw new Error(`Hits request failed (${hitsResp.status})`);
    }
    const hitsText = await hitsResp.text();
    let totalCount =
      Number((hitsText.match(/numberOfFeatures="(\d+)"/) || [])[1]) || 0;

    // 2. Obtener hasta 2000 features en JSON
    const dataParams = new URLSearchParams({
      service: "WFS",
      version: "1.0.0",
      request: "GetFeature",
      typeName,
      maxFeatures: "2000",
      outputFormat: "application/json",
      ...(cqlFilter && { cql_filter: cqlFilter }),
    });
    const dataResp = await fetch(`${GEOSERVER_WFS_URL}?${dataParams}`);
    if (!dataResp.ok) {
      throw new Error(`Data request failed (${dataResp.status})`);
    }
    const dataJson = await dataResp.json();

    // 3. Si la petición de hits devolvió 0, usar fallback desde el JSON
    if (totalCount === 0) {
      if (Number.isInteger(dataJson.totalFeatures)) {
        totalCount = dataJson.totalFeatures;
      } else if (Array.isArray(dataJson.features)) {
        totalCount = dataJson.features.length;
      }
    }

    // 4. Responder con el total real y el array de features
    return res.json({
      totalCount,
      features: dataJson.features || [],
    });
  } catch (error) {
    console.error("Error en /api/geoserver-data:", error);
    return res.status(500).json({ error: error.message });
  }
});

/* * Inicia el servidor en el puerto 3000
 * Muestra la URL en la consola cuando el servidor arranca
 */
app.listen(3000, () => {
  console.log("http://localhost:3000");
});
