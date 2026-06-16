/**
 * Parser del protocolo OsmAnd para Traccar Client
 *
 * Traccar Client envía datos por HTTP GET/POST al puerto 5055
 * con los siguientes parámetros estándar de OsmAnd:
 *
 * Parámetros Obligatorios:
 *   id        -> Identificador único del dispositivo (device_uid)
 *   lat       -> Latitud en grados decimales
 *   lon       -> Longitud en grados decimales
 *   timestamp -> Unix timestamp en segundos o milisegundos
 *
 * Parámetros Opcionales:
 *   speed     -> Velocidad en nudos (knots) - convertimos a km/h
 *   bearing   -> Rumbo / curso en grados (0-360)
 *   altitude  -> Altitud en metros
 *   accuracy  -> Precisión GPS en metros
 *   battery   -> Nivel de batería en porcentaje (0-100)
 *   charging  -> Estado de carga (true/false)
 *   hdop      -> Dilución de precisión horizontal
 *   sat       -> Número de satélites
 *
 * Ejemplo de URL:
 * GET /?id=123456&lat=-2.1894&lon=-79.8891&timestamp=1715432100&speed=15.5&bearing=270&altitude=12&accuracy=8&battery=85&charging=false
 */

// Filtro de precisión mínima (ignora puntos con GPS muy impreciso)
const MAX_ACCURACY = 100; // metros
const MIN_SATELLITES = 0; // mínimo de satélites (0 = desactivado)
const SPEED_CONVERSION = 1.852; // nudos -> km/h (OsmAnd usa nudos)

/**
 * Parsea la query string del protocolo OsmAnd y devuelve
 * un objeto estructurado listo para insertar en la BD.
 *
 * @param {Object} query - Objeto de query string (req.query de Express)
 * @returns {Object|null} - Objeto de posición parseado o null si es inválido
 */
export function parseOsmAnd(query) {
  // Validación de campos obligatorios
  const id = query.id;
  const lat = parseFloat(query.lat);
  const lon = parseFloat(query.lon);
  let timestamp = query.timestamp;

  if (!id || isNaN(lat) || isNaN(lon) || !timestamp) {
    console.warn("[PARSER] Faltan campos obligatorios:", { id, lat, lon, timestamp });
    return null;
  }

  // Validar rango de coordenadas
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    console.warn("[PARSER] Coordenadas fuera de rango:", { lat, lon });
    return null;
  }

  // Validar lat/lon no son 0,0 (GPS sin señal)
  if (lat === 0 && lon === 0) {
    console.warn("[PARSER] Coordenadas 0,0 ignoradas (GPS sin fix)");
    return null;
  }

  // Convertir timestamp a formato ISO 8601
  // Traccar Client puede enviar timestamp en segundos o milisegundos
  let ts = parseInt(timestamp, 10);
  if (ts < 1000000000000) {
    // Timestamp en segundos, convertir a milisegundos
    ts = ts * 1000;
  }
  const time = new Date(ts).toISOString();

  // Validar que la fecha no sea futura ni muy antigua
  const now = Date.now();
  if (ts > now + 86400000) {
    // Más de 1 día en el futuro
    console.warn("[PARSER] Timestamp futuro rechazado:", time);
    return null;
  }
  if (ts < now - 365 * 86400000 * 1000) {
    // Más de 1 año en el pasado
    console.warn("[PARSER] Timestamp muy antiguo rechazado:", time);
    return null;
  }

  // Parsear velocidad: OsmAnd envía en nudos, convertir a km/h
  let speed = parseFloat(query.speed) || 0;
  if (speed > 0) {
    speed = speed * SPEED_CONVERSION; // nudos -> km/h
  }

  // Parsear rumbo
  const course = parseFloat(query.bearing) || 0;

  // Parsear altitud
  const altitude = parseFloat(query.altitude) || 0;

  // Parsear precisión GPS
  const accuracy = parseFloat(query.accuracy) || 0;

  // Filtrar por precisión (ignorar puntos con GPS muy malo)
  if (MAX_ACCURACY > 0 && accuracy > MAX_ACCURACY) {
    console.warn(`[PARSER] Precisión GPS baja (${accuracy}m > ${MAX_ACCURACY}m), ignorando`);
    return null;
  }

  // Construir atributos en JSONB
  const attributes = {
    battery: parseFloat(query.battery) ?? null,
    charging: query.charging === "true" || query.charging === "1",
    hdop: parseFloat(query.hdop) || null,
    satellites: parseInt(query.sat) || null,
  };

  // Limpiar atributos nulos
  for (const key of Object.keys(attributes)) {
    if (attributes[key] === null) {
      delete attributes[key];
    }
  }

  return {
    time,
    device_id: parseInt(id, 10) || id, // device_id puede ser numérico o string
    latitude: lat,
    longitude: lon,
    altitude,
    speed: Math.round(speed * 100) / 100, // redondear a 2 decimales
    course: Math.round(course * 100) / 100,
    accuracy: Math.round(accuracy * 100) / 100,
    attributes,
  };
}

/**
 * Parsea el body POST (formato alternativo de Traccar Client)
 * Algunas versiones envían los datos como form-urlencoded en el body
 *
 * @param {Object} body - req.body de Express
 * @returns {Object|null}
 */
export function parseOsmAndPost(body) {
  // El body ya viene parseado por express.urlencoded()
  // Tiene la misma estructura que los query params
  return parseOsmAnd(body);
}

/**
 * Intenta parsear desde query string o body POST
 * según el método HTTP utilizado
 *
 * @param {Object} req - Request de Express
 * @returns {Array<Object>} - Array de posiciones parseadas
 */
export function parseRequest(req) {
  const positions = [];

  // Traccar Client puede enviar múltiples posiciones en batch
  // Formato batch: ?id=123&lat=1,2,3&lon=4,5,6&timestamp=100,200,300
  const latRaw = req.query.lat || req.body.lat;
  const lonRaw = req.query.lon || req.body.lon;
  const timeRaw = req.query.timestamp || req.body.timestamp;

  // Detectar si es batch (contiene comas)
  if (latRaw && latRaw.includes(",")) {
    const lats = latRaw.split(",");
    const lons = (lonRaw || "").split(",");
    const times = (timeRaw || "").split(",");

    for (let i = 0; i < lats.length; i++) {
      const batchQuery = {
        id: req.query.id || req.body.id,
        lat: lats[i],
        lon: lons[i] || lons[0],
        timestamp: times[i] || times[0],
        speed: req.query.speed || req.body.speed,
        bearing: req.query.bearing || req.body.bearing,
        altitude: req.query.altitude || req.body.altitude,
        accuracy: req.query.accuracy || req.body.accuracy,
        battery: req.query.battery || req.body.battery,
        charging: req.query.charging || req.body.charging,
        hdop: req.query.hdop || req.body.hdop,
        sat: req.query.sat || req.body.sat,
      };
      const pos = parseOsmAnd(batchQuery);
      if (pos) positions.push(pos);
    }
  } else {
    // Posición única
    const source = req.method === "POST" ? req.body : req.query;
    const pos = parseOsmAnd(source);
    if (pos) positions.push(pos);
  }

  return positions;
}

export default { parseOsmAnd, parseOsmAndPost, parseRequest };