/**
 * Cron Job Nocturno: Pre-cálculo de Rutas (Optimizado sin PostGIS)
 *
 * Se ejecuta diariamente a las 3:00 AM (configurable).
 * Genera GeoJSON consolidado del día anterior para cada dispositivo
 * y lo almacena en Redis para consultas instantáneas en el Dashboard.
 */

import pg from 'pg';
import { createClient } from 'redis';

// ============================================
// Configuración
// ============================================
const DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://dmt_admin:dmt_secure_pass_2026@timescaledb:5432/dmtracker';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

const CRON_HOUR = parseInt(process.env.CRON_HOUR || '3', 10);
const DAYS_TO_PRECOMPUTE = parseInt(process.env.DAYS_TO_PRECOMPUTE || '1', 10);
const CACHE_TTL = 60 * 60 * 24 * 30; // 30 días

const { Pool } = pg;

// ============================================
// Funciones Matemáticas
// ============================================

/**
 * Calcula la distancia entre dos puntos usando la fórmula de Haversine
 */
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === lat2 && lon1 === lon2) return 0.0;
  const R = 6371.0; // Radio de la Tierra en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.asin(Math.sqrt(a));
  return R * c;
}

// ============================================
// Funciones Principales
// ============================================

/**
 * Obtener lista de dispositivos activos
 */
async function getActiveDevices(pool) {
  const result = await pool.query(
    "SELECT id, uniqueid, name FROM tc_devices WHERE status IS NOT NULL"
  );
  return result.rows;
}

/**
 * Generar GeoJSON consolidado para un dispositivo sin depender de PostGIS
 */
async function generateRouteGeojson(pool, deviceId, dateStr) {
  const query = `
    SELECT latitude, longitude, speed, servertime, altitude, course, accuracy, attributes
    FROM tc_positions
    WHERE deviceid = $1
      AND servertime >= $2::timestamptz
      AND servertime <= $3::timestamptz
    ORDER BY servertime ASC
  `;

  const fromDate = `${dateStr}T00:00:00`;
  const toDate = `${dateStr}T23:59:59.999`;

  const result = await pool.query(query, [deviceId, fromDate, toDate]);
  const rows = result.rows;

  if (!rows || rows.length === 0) {
    return null;
  }

  const total_points = rows.length;
  const first_point = rows[0];
  const last_point = rows[rows.length - 1];

  let total_distance = 0.0;
  let max_speed = 0.0;
  let speed_sum = 0.0;
  let valid_speeds_count = 0;

  const coordinates = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    coordinates.push([r.longitude, r.latitude]);

    if (r.speed !== null && r.speed !== undefined) {
      const speedKmh = parseFloat(r.speed);
      speed_sum += speedKmh;
      valid_speeds_count++;
      if (speedKmh > max_speed) {
        max_speed = speedKmh;
      }
    }

    if (i < rows.length - 1) {
      const next_r = rows[i + 1];
      total_distance += calculateHaversineDistance(
        r.latitude,
        r.longitude,
        next_r.latitude,
        next_r.longitude
      );
    }
  }

  const avg_speed = valid_speeds_count > 0 ? speed_sum / valid_speeds_count : 0.0;
  const duration_min = (new Date(last_point.servertime) - new Date(first_point.servertime)) / 60000.0;

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: coordinates,
        },
        properties: {
          deviceid: deviceId,
          date: dateStr,
          total_points: total_points,
          distance_km: parseFloat(total_distance.toFixed(2)),
          duration_min: parseFloat(duration_min.toFixed(1)),
          avg_speed_kmh: parseFloat(avg_speed.toFixed(2)),
          max_speed_kmh: parseFloat(max_speed.toFixed(2)),
          start_time: first_point.servertime,
          end_time: last_point.servertime,
          start_lat: parseFloat(first_point.latitude),
          start_lon: parseFloat(first_point.longitude),
          end_lat: parseFloat(last_point.latitude),
          end_lon: parseFloat(last_point.longitude),
          generated_at: new Date().toISOString(),
        },
      },
    ],
  };
}

/**
 * Procesar un solo día
 */
async function processDay(pool, redis, dateStr) {
  console.log(`\n📅 Procesando rutas del ${dateStr}...`);

  const devices = await getActiveDevices(pool);
  console.log(`   📱 ${devices.length} dispositivos activos`);

  let successCount = 0;
  let emptyCount = 0;
  let errorCount = 0;

  for (const device of devices) {
    try {
      const geojson = await generateRouteGeojson(pool, device.id, dateStr);
      const key = `route:${device.id}:${dateStr}`;

      if (geojson) {
        const props = geojson.features[0].properties;
        await redis.set(key, JSON.stringify(geojson), { EX: CACHE_TTL });
        successCount++;
        console.log(
          `   ✅ ${device.name} (ID:${device.id}) → ${props.total_points} pts, ${props.distance_km} km`
        );
      } else {
        await redis.set(
          key,
          JSON.stringify({ type: 'FeatureCollection', features: [], empty: true }),
          { EX: CACHE_TTL }
        );
        emptyCount++;
        console.log(`   ⚠️  ${device.name} (ID:${device.id}) → Sin datos`);
      }
    } catch (err) {
      errorCount++;
      console.error(`   ❌ ${device.name} (ID:${device.id}) → Error: ${err.message}`);
    }
  }

  console.log(
    `\n📊 Resumen ${dateStr}: ${successCount} OK, ${emptyCount} vacíos, ${errorCount} errores`
  );
}

/**
 * Función principal del cron
 */
async function run() {
  console.log('='.repeat(60));
  console.log('⏰ D-MUJERES-TRACCAR - Cron de Pre-cálculo de Rutas (Optimizado)');
  console.log(`🕐 Inicio: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const pool = new Pool({
    connectionString: DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 30000,
  });

  const redis = createClient({ url: REDIS_URL });
  redis.on('error', (err) => console.error('Redis error:', err));
  await redis.connect();
  console.log('✅ Conectado a Redis');

  try {
    for (let i = 1; i <= DAYS_TO_PRECOMPUTE; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      await processDay(pool, redis, dateStr);
    }
    console.log('\n✅ Cron completado exitosamente');
  } catch (err) {
    console.error('❌ Error en cron:', err);
  } finally {
    await redis.quit();
    await pool.end();
  }

  console.log(`🕐 Fin: ${new Date().toISOString()}`);
}

/**
 * Modo scheduler
 */
async function startScheduler() {
  console.log(`⏳ Scheduler iniciado. Próxima ejecución: ${CRON_HOUR}:00 UTC diariamente`);
  await run();

  const scheduleNext = () => {
    const now = new Date();
    const next = new Date(now);
    next.setUTCHours(CRON_HOUR, 0, 0, 0);

    if (now.getUTCHours() >= CRON_HOUR) {
      next.setDate(next.getDate() + 1);
    }

    const msUntilNext = next.getTime() - now.getTime();
    console.log(
      `⏰ Próxima ejecución: ${next.toISOString()} (en ${Math.round(msUntilNext / 3600000)} horas)`
    );

    setTimeout(async () => {
      await run();
      scheduleNext();
    }, msUntilNext);
  };

  scheduleNext();
}

if (process.env.RUN_ONCE === 'true') {
  run().catch(console.error);
} else {
  startScheduler().catch(console.error);
}
