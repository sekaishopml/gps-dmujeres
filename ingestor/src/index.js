import express from "express";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pg from "pg";
import { parseRequest } from "./parser.js";
import { insertPosition, insertBatch, healthCheck, closePool, pool } from "./db.js";

const PORT = parseInt(process.env.PORT || "5055", 10);
const LOG_LEVEL = process.env.LOG_LEVEL || "info";

const app = express();

// ============================================
// Middleware
// ============================================

// Compresión para respuestas
app.use(compression());

// Parsear body POST como urlencoded (formato Traccar Client)
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// Rate limiting: máximo 200 peticiones por minuto por IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Demasiadas peticiones, intente más tarde",
});
app.use(limiter);

// Logging básico
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    if (LOG_LEVEL === "debug" || res.statusCode >= 400) {
      console.log(
        `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms)`
      );
    }
  });
  next();
});

// ============================================
// Rutas
// ============================================

// Health check
app.get("/health", async (req, res) => {
  const db = await healthCheck();
  res.json({
    status: "ok",
    service: "dmt-ingestor",
    timestamp: new Date().toISOString(),
    database: db.ok ? "connected" : "disconnected",
    db_time: db.db_time || null,
  });
});

// GET: Protocolo OsmAnd (query string)
// POST: Protocolo OsmAnd (form-urlencoded body)
app.all("/", async (req, res) => {
  try {
    const positions = parseRequest(req);

    if (!positions.length) {
      // Si no se pudo parsear, devolver 200 para que la app no reintente
      // (Traccar Client reintenta si recibe error)
      console.warn("[INGESTOR] Petición sin posiciones válidas:", {
        method: req.method,
        query: req.query,
        body: req.body,
      });
      return res.status(200).json({ ok: true, positions: 0, reason: "invalid_data" });
    }

    // Buscar o crear dispositivo por UID
    for (const pos of positions) {
      const uid = String(pos.device_id);
      const result = await pool.query("SELECT id FROM tc_devices WHERE uniqueid = $1", [uid]);
      let deviceDbId;
      if (result.rows.length === 0) {
        const insert = await pool.query(
          "INSERT INTO tc_devices (uniqueid, name) VALUES ($1, $2) ON CONFLICT (uniqueid) DO UPDATE SET name=EXCLUDED.name RETURNING id",
          [uid, `Dispositivo ${uid}`]
        );
        deviceDbId = insert.rows[0].id;
      } else {
        deviceDbId = result.rows[0].id;
      }
      pos.device_id = deviceDbId;
    }

    // Insertar en PostgreSQL
    if (positions.length === 1) {
      await insertPosition(positions[0]);
    } else {
      await insertBatch(positions);
    }

    if (LOG_LEVEL === "debug") {
      console.log(
        `[INGESTOR] Insertadas ${positions.length} pos(es) | device=${positions[0].device_id} | lat=${positions[0].latitude} lon=${positions[0].longitude}`
      );
    }

    res.status(200).json({ ok: true, positions: positions.length });
  } catch (err) {
    console.error("[INGESTOR] Error procesando petición:", err.message);
    // Importante: devolver 200 aunque haya error DB para evitar reintentos
    // que podrían causar flooding en el servidor
    res.status(200).json({
      ok: false,
      positions: 0,
      error: "internal_error",
    });
  }
});

// ============================================
// Graceful Shutdown
// ============================================
process.on("SIGTERM", async () => {
  console.log("[INGESTOR] Recibida señal SIGTERM, cerrando...");
  await closePool();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[INGESTOR] Recibida señal SIGINT, cerrando...");
  await closePool();
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  console.error("[INGESTOR] Excepción no capturada:", err);
});

process.on("unhandledRejection", (reason) => {
  console.error("[INGESTOR] Promesa rechazada no manejada:", reason);
});

// ============================================
// Inicio del Servidor
// ============================================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`[INGESTOR] 🚀 Iniciado en puerto ${PORT}`);
  console.log(`[INGESTOR] 📡 Escuchando protocolo OsmAnd (Traccar Client compatible)`);
  console.log(`[INGESTOR] 🕐 ${new Date().toISOString()}`);
});

export default app;