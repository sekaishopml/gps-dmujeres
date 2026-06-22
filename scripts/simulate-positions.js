import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: "postgresql://dmt_admin:dmt_prod_secure_2026_change_me@localhost:5432/dmtracker",
  max: 10,
});

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

// Guayaquil, Ecuador area
const CENTER_LAT = -2.1894;
const CENTER_LNG = -79.8891;

function simulateRoute(deviceId, deviceName, startLat, startLng, numPoints, totalMinutes, speedKmh, courseVariation) {
  const points = [];
  const mps = speedKmh / 3.6; // meters per second
  const intervalSec = (totalMinutes * 60) / numPoints;
  const metersPerStep = mps * intervalSec;
  const latPerMeter = 0.00000899;
  const lngPerMeter = 0.00000899 / Math.cos(startLat * Math.PI / 180);
  
  let lat = startLat;
  let lng = startLng;
  let course = Math.random() * 360;
  const baseTime = new Date("2026-06-22T10:00:00Z");
  
  for (let i = 0; i < numPoints; i++) {
    course += randomBetween(-courseVariation, courseVariation);
    const rad = course * Math.PI / 180;
    const dist = metersPerStep + randomBetween(-metersPerStep * 0.2, metersPerStep * 0.2);
    lat += Math.cos(rad) * dist * latPerMeter;
    lng += Math.sin(rad) * dist * lngPerMeter;
    
    const time = new Date(baseTime.getTime() + i * intervalSec * 1000);
    const currentSpeed = speedKmh + randomBetween(-5, 5);
    
    points.push({
      servertime: time,
      devicetime: time,
      fixtime: time,
      deviceid: deviceId,
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6)),
      altitude: Math.round(50 + randomBetween(-10, 10)),
      speed: parseFloat(Math.max(0, currentSpeed).toFixed(2)),
      course: parseFloat((course % 360).toFixed(1)),
      accuracy: parseFloat((5 + randomBetween(0, 10)).toFixed(1)),
      attributes: JSON.stringify({
        batteryLevel: Math.round(60 + randomBetween(0, 40)),
        charging: i % 10 !== 0,
      }),
      protocol: "osmand",
      valid: true,
    });
  }
  
  return { deviceId, deviceName, count: points.length, points };
}

async function insertBatch(points, batchSize = 500) {
  let inserted = 0;
  for (let i = 0; i < points.length; i += batchSize) {
    const batch = points.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let idx = 1;
    
    for (const p of batch) {
      values.push(`($${idx},$${idx+1},$${idx+2},$${idx+3},$${idx+4},$${idx+5},$${idx+6},$${idx+7},$${idx+8},$${idx+9},$${idx+10},$${idx+11},$${idx+12})`);
      params.push(p.servertime, p.devicetime, p.fixtime, p.deviceid, p.latitude, p.longitude, p.altitude, p.speed, p.course, p.accuracy, p.attributes, p.protocol, p.valid);
      idx += 13;
    }
    
    const query = `INSERT INTO tc_positions (servertime, devicetime, fixtime, deviceid, latitude, longitude, altitude, speed, course, accuracy, attributes, protocol, valid) VALUES ${values.join(", ")}`;
    
    try {
      await pool.query(query, params);
      inserted += batch.length;
      console.log(`Inserted ${inserted}/${points.length} positions`);
    } catch (err) {
      console.error(`Batch error at offset ${i}:`, err.message);
    }
  }
}

async function createDeviceIfNotExists(deviceId, name) {
  try {
    const result = await pool.query("SELECT id FROM tc_devices WHERE uniqueid = $1", [String(deviceId)]);
    if (result.rows.length === 0) {
      const insert = await pool.query(
        "INSERT INTO tc_devices (uniqueid, name, lastupdate) VALUES ($1, $2, NOW()) RETURNING id",
        [String(deviceId), name]
      );
      return insert.rows[0].id;
    }
    return result.rows[0].id;
  } catch (err) {
    console.error("Error creating device:", err.message);
    throw err;
  }
}

async function main() {
  console.log("🚗 Simulating 2500+ GPS positions...\n");
  
  // Device 1: Car route (fast, 60kmh, dense points for smooth route)
  const carId = await createDeviceIfNotExists(1001, "Coche Guayaquil");
  const carRoute = simulateRoute(carId, "Coche Guayaquil", CENTER_LAT, CENTER_LNG, 1200, 60, 60, 15);
  console.log(`Device 1 (Car): ${carRoute.count} points, ${carRoute.deviceName}`);
  
  // Device 2: Walking route (slow, 5kmh, lots of turns)
  const walkId = await createDeviceIfNotExists(1002, "Peaton Malecon");
  const walkRoute = simulateRoute(walkId, "Peaton Malecon", CENTER_LAT + 0.01, CENTER_LNG - 0.01, 800, 120, 5, 45);
  console.log(`Device 2 (Walking): ${walkRoute.count} points, ${walkRoute.deviceName}`);
  
  // Device 3: Mixed route (car + stop)
  const mixedId = await createDeviceIfNotExists(1003, "Coche Mixto");
  const mixedRoute1 = simulateRoute(mixedId, "Coche Mixto", CENTER_LAT - 0.02, CENTER_LNG + 0.02, 500, 30, 45, 10);
  console.log(`Device 3 (Mixed): ${mixedRoute1.count} points, ${mixedRoute1.deviceName}`);
  
  // Insert all batches
  console.log("\n📥 Inserting car route...");
  await insertBatch(carRoute.points);
  
  console.log("\n📥 Inserting walking route...");
  await insertBatch(walkRoute.points);
  
  console.log("\n📥 Inserting mixed route...");
  await insertBatch(mixedRoute1.points);
  
  const total = carRoute.count + walkRoute.count + mixedRoute1.count;
  console.log(`\n✅ Done! Total: ${total} positions across 3 devices`);
  
  await pool.end();
}

main().catch(console.error);
