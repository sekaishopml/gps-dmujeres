import pg from "pg";

const { Pool } = pg;

// Pool de conexiones optimizado para inserciones asíncronas
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // máximo 20 conexiones concurrentes
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("[DB] Error inesperado en el pool:", err.message);
});

/**
 * Inserta una posición GPS en la hypertable tc_positions
 * @param {Object} position - Datos parseados de la posición
 * @returns {Promise<void>}
 */
export async function insertPosition(position) {
  const {
    time,
    device_id,
    latitude,
    longitude,
    altitude = 0,
    speed = 0,
    course = 0,
    accuracy = 0,
    attributes = {},
  } = position;

  const query = `
    INSERT INTO tc_positions (time, device_id, latitude, longitude, altitude, speed, course, accuracy, attributes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
  `;

  const values = [
    time,
    device_id,
    latitude,
    longitude,
    altitude,
    speed,
    course,
    accuracy,
    JSON.stringify(attributes),
  ];

  try {
    await pool.query(query, values);
  } catch (err) {
    console.error("[DB] Error insertando posición:", err.message);
    throw err;
  }
}

/**
 * Inserta múltiples posiciones en batch (más eficiente)
 * @param {Array<Object>} positions
 * @returns {Promise<void>}
 */
export async function insertBatch(positions) {
  if (!positions.length) return;

  const values = [];
  const params = [];
  let paramIndex = 1;

  for (const pos of positions) {
    values.push(
      `($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3}, $${paramIndex + 4}, $${paramIndex + 5}, $${paramIndex + 6}, $${paramIndex + 7}, $${paramIndex + 8})`
    );
    params.push(
      pos.time,
      pos.device_id,
      pos.latitude,
      pos.longitude,
      pos.altitude || 0,
      pos.speed || 0,
      pos.course || 0,
      pos.accuracy || 0,
      JSON.stringify(pos.attributes || {})
    );
    paramIndex += 9;
  }

  const query = `INSERT INTO tc_positions (time, device_id, latitude, longitude, altitude, speed, course, accuracy, attributes) VALUES ${values.join(", ")}`;

  try {
    await pool.query(query, params);
  } catch (err) {
    console.error("[DB] Error en batch insert:", err.message);
    throw err;
  }
}

/**
 * Verifica estado de la conexión con PostgreSQL
 */
export async function healthCheck() {
  try {
    const result = await pool.query("SELECT 1 AS ok, current_timestamp AS now");
    return { ok: true, db_time: result.rows[0].now };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Cierra el pool de conexiones gracefulmente
 */
export async function closePool() {
  await pool.end();
  console.log("[DB] Pool de conexiones cerrado");
}

export { pool };
export default pool;
