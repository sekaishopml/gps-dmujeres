# -*- coding: utf-8 -*-
import os
import logging
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import HTMLResponse
import asyncpg

def parse_naive_utc(date_str: str) -> datetime:
    # Standardize 'Z' to '+00:00' for compatible parsing
    if date_str.endswith('Z'):
        date_str = date_str[:-1] + '+00:00'
    try:
        dt = datetime.fromisoformat(date_str)
    except ValueError:
        # Fallback to simple date parsing if format is like YYYY-MM-DD
        if len(date_str) == 10:
            dt = datetime.strptime(date_str, "%Y-%m-%d")
        else:
            raise
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


# Configuración de Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("dmt-debug")

# Variables de Entorno
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dmt_admin:dmt_prod_secure_2026_change_me@timescaledb:5432/dmtracker")
LOG_FILE_PATH = os.getenv("LOG_FILE_PATH", "/opt/traccar/logs/tracker-server.log")

app = FastAPI(title="GPS D-MUJERES Debug Dashboard")
db_pool: asyncpg.Pool | None = None

async def get_pool() -> asyncpg.Pool:
    global db_pool
    if db_pool is None:
        try:
            db_pool = await asyncpg.create_pool(DATABASE_URL, min_size=1, max_size=5)
            logger.info("✅ Conectado al pool de PostgreSQL exitosamente.")
        except Exception as e:
            logger.error(f"❌ Error al crear pool de base de datos: {e}")
            raise e
    return db_pool

@app.on_event("startup")
async def startup():
    await get_pool()

@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        await db_pool.close()
        logger.info("Conexiones de base de datos cerradas.")

# Helper to read last N lines of a file
def tail_log_file(filepath: str, lines_count: int = 50) -> List[str]:
    if not os.path.exists(filepath):
        return [f"Archivo de log no encontrado en: {filepath}. Asegúrate de que el contenedor de Traccar está corriendo y el volumen está montado."]
    try:
        with open(filepath, 'rb') as f:
            f.seek(0, os.SEEK_END)
            size = f.tell()
            block_size = 4096
            data = []
            lines_found = 0
            while size > 0 and lines_found < lines_count + 1:
                if size - block_size > 0:
                    f.seek(size - block_size)
                    block = f.read(block_size)
                    size -= block_size
                else:
                    f.seek(0)
                    block = f.read(size)
                    size = 0
                data.insert(0, block)
                lines_found += block.count(b'\n')
            lines = b''.join(data).split(b'\n')
            return [line.decode('utf-8', errors='ignore') for line in lines[-lines_count-1:] if line]
    except Exception as e:
        return [f"Error al leer log: {str(e)}"]

# API Endpoints
@app.get("/api/sys-status")
async def sys_status():
    # 1. CPU Usage
    def read_cpu_times():
        try:
            with open('/proc/stat', 'r') as f:
                for line in f:
                    if line.startswith('cpu '):
                        parts = list(map(int, line.split()[1:5]))
                        return sum(parts), parts[3]
        except Exception:
            pass
        return 0, 0
    
    t1, idle1 = read_cpu_times()
    await asyncio.sleep(0.1)
    t2, idle2 = read_cpu_times()
    
    total_diff = t2 - t1
    idle_diff = idle2 - idle1
    cpu_percent = 0.0
    if total_diff > 0:
        cpu_percent = round((1.0 - (idle_diff / total_diff)) * 100, 1)
        
    # 2. RAM Usage (via /proc/meminfo)
    ram_total = 0
    ram_used = 0
    ram_percent = 0.0
    try:
        meminfo = {}
        with open('/proc/meminfo', 'r') as f:
            for line in f:
                parts = line.split(':')
                if len(parts) == 2:
                    name = parts[0].strip()
                    val = parts[1].split()
                    if val:
                        meminfo[name] = int(val[0])
        if 'MemTotal' in meminfo:
            total_kb = meminfo['MemTotal']
            avail_kb = meminfo.get('MemAvailable', meminfo.get('MemFree', 0) + meminfo.get('Buffers', 0) + meminfo.get('Cached', 0))
            used_kb = total_kb - avail_kb
            ram_total = total_kb * 1024
            ram_used = used_kb * 1024
            ram_percent = round((used_kb / total_kb) * 100, 1)
    except Exception:
        pass
        
    # 3. Disk Usage
    disk_total = 0
    disk_used = 0
    disk_percent = 0.0
    try:
        import shutil
        total, used, free = shutil.disk_usage('/')
        disk_total = total
        disk_used = used
        disk_percent = round((used / total) * 100, 1)
    except Exception:
        pass

    # 4. Database Size (PostgreSQL/TimescaleDB)
    db_size = 0
    try:
        pool = await get_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow("SELECT pg_database_size('dmtracker');")
            if row:
                db_size = row[0]
    except Exception:
        pass
        
    return {
        "cpu": cpu_percent,
        "ram": {
            "total": ram_total,
            "used": ram_used,
            "percent": ram_percent
        },
        "disk": {
            "total": disk_total,
            "used": disk_used,
            "percent": disk_percent
        },
        "db_size": db_size
    }

@app.get("/api/db-status")
async def db_status():
    pool = await get_pool()
    try:
        async with pool.acquire() as conn:
            # 1. Versión de Postgres y conexiones
            version_row = await conn.fetchrow("SELECT version();")
            ext_row = await conn.fetchrow("SELECT extversion FROM pg_extension WHERE extname = 'timescaledb';")
            connections_row = await conn.fetchrow("SELECT count(*) FROM pg_stat_activity WHERE datname = current_database();")
            
            # 2. Conteo de filas
            counts_row = await conn.fetchrow("""
                SELECT 
                    (SELECT count(*) FROM tc_positions) as positions,
                    (SELECT count(*) FROM tc_events) as events,
                    (SELECT count(*) FROM tc_devices) as devices,
                    (SELECT count(*) FROM tc_users) as users
            """)
            
            # 3. Datos de hypertables
            hypertables = await conn.fetch("""
                SELECT hypertable_name, num_dimensions, num_chunks, compression_enabled 
                FROM timescaledb_information.hypertables;
            """)
            
            # 4. Tamaños físicos
            sizes = await conn.fetch("""
                SELECT 
                    relname as table_name,
                    pg_size_pretty(pg_total_relation_size(c.oid)) as total_size,
                    pg_total_relation_size(c.oid) as total_bytes
                FROM pg_class c
                LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' 
                  AND c.relname IN ('tc_positions', 'tc_events', 'tc_devices', 'tc_users')
            """)

            # 5. Rango de fechas en tc_positions
            range_row = await conn.fetchrow("SELECT min(fixtime) as min_time, max(fixtime) as max_time FROM tc_positions;")
            
            # Formatear hypertables
            hypertables_list = []
            for h in hypertables:
                hypertables_list.append({
                    "name": h["hypertable_name"],
                    "chunks": h["num_chunks"],
                    "compression": h["compression_enabled"]
                })
                
            # Formatear tamaños
            sizes_dict = {s["table_name"]: {"size": s["total_size"], "bytes": s["total_bytes"]} for s in sizes}

            return {
                "database": {
                    "version": version_row[0],
                    "timescaledb_version": ext_row[0] if ext_row else "No instalada",
                    "active_connections": connections_row[0],
                },
                "counts": {
                    "positions": counts_row["positions"],
                    "events": counts_row["events"],
                    "devices": counts_row["devices"],
                    "users": counts_row["users"]
                },
                "hypertables": hypertables_list,
                "sizes": sizes_dict,
                "range": {
                    "min": range_row["min_time"].isoformat() if range_row["min_time"] else None,
                    "max": range_row["max_time"].isoformat() if range_row["max_time"] else None
                },
                "timestamp": datetime.utcnow().isoformat()
            }
    except Exception as e:
        logger.error(f"Error en endpoint db-status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/users")
async def get_users():
    pool = await get_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch("SELECT id, name, email, administrator, readonly, devicelimit FROM tc_users ORDER BY id;")
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Error en endpoint users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/devices")
async def get_devices():
    pool = await get_pool()
    try:
        async with pool.acquire() as conn:
            rows = await conn.fetch("SELECT id, name, uniqueid, category, status, lastupdate, phone FROM tc_devices ORDER BY name;")
            return [dict(r) for r in rows]
    except Exception as e:
        logger.error(f"Error en endpoint devices: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/logs")
async def get_logs(limit: int = Query(50, ge=10, le=200)):
    return {"logs": tail_log_file(LOG_FILE_PATH, limit)}


@app.get("/api/stops")
async def get_stops(
    device_id: int = Query(..., description="ID del dispositivo Traccar"),
    from_date: str = Query(..., description="Fecha inicio ISO-8601 (ej: 2026-06-01T00:00:00)"),
    to_date:   str = Query(..., description="Fecha fin ISO-8601 (ej: 2026-06-30T23:59:59)"),
    min_duration_min: float = Query(5.0, description="Duración mínima de parada en minutos"),
    radius_meters:    float = Query(5.0,  description="Radio en metros para considerar mismo lugar"),
):
    """
    Detecta paradas inteligentes de un colaborador en un rango de fechas.
    Utiliza el algoritmo Haversine sobre ventanas deslizantes directamente en TimescaleDB.
    Resultado: lista de paradas con inicio, fin, duración y coordenadas del centro.
    Rendimiento: ~9ms para 1 mes completo (19,000 puntos) gracias a Hypertable + índice.
    """
    # Validar fechas
    try:
        from_dt = parse_naive_utc(from_date)
        to_dt   = parse_naive_utc(to_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use ISO-8601: 2026-06-01T00:00:00")

    if from_dt >= to_dt:
        raise HTTPException(status_code=400, detail="from_date debe ser anterior a to_date")

    pool = await get_pool()

    # Verificar que el dispositivo existe
    async with pool.acquire() as conn:
        device = await conn.fetchrow(
            "SELECT id, name FROM tc_devices WHERE id = $1", device_id
        )
        if not device:
            raise HTTPException(status_code=404, detail=f"Dispositivo {device_id} no encontrado")

        # Query principal: detección de paradas con radio configurable
        # Algoritmo: Haversine sobre ventana deslizante + agrupamiento de segmentos continuos
        min_duration_sec = min_duration_min * 60

        stops_rows = await conn.fetch("""
            WITH raw AS (
                SELECT fixtime, latitude, longitude, speed
                FROM tc_positions
                WHERE deviceid = $1
                  AND fixtime BETWEEN $2 AND $3
                ORDER BY fixtime
            ),
            with_dist AS (
                SELECT *,
                    (6371000 * acos(GREATEST(-1, LEAST(1,
                        cos(radians(LAG(latitude) OVER w)) * cos(radians(latitude)) *
                        cos(radians(longitude) - radians(LAG(longitude) OVER w)) +
                        sin(radians(LAG(latitude) OVER w)) * sin(radians(latitude))
                    )))) AS dist_m
                FROM raw
                WINDOW w AS (ORDER BY fixtime)
            ),
            labeled AS (
                SELECT *,
                    CASE WHEN (dist_m IS NULL OR dist_m <= $4) THEN 0 ELSE 1 END AS moved,
                    SUM(CASE WHEN (dist_m IS NULL OR dist_m <= $4) THEN 0 ELSE 1 END)
                        OVER (ORDER BY fixtime) AS group_id
                FROM with_dist
            ),
            stops AS (
                SELECT
                    group_id,
                    MIN(fixtime)  AS start_time,
                    MAX(fixtime)  AS end_time,
                    AVG(latitude) AS center_lat,
                    AVG(longitude) AS center_lon,
                    EXTRACT(EPOCH FROM MAX(fixtime) - MIN(fixtime)) AS duration_sec
                FROM labeled
                WHERE moved = 0
                GROUP BY group_id
                HAVING EXTRACT(EPOCH FROM MAX(fixtime) - MIN(fixtime)) >= $5
            )
            SELECT
                start_time,
                end_time,
                ROUND(duration_sec::numeric / 60, 1) AS duration_min,
                ROUND(center_lat::numeric, 6)        AS latitude,
                ROUND(center_lon::numeric, 6)        AS longitude
            FROM stops
            ORDER BY start_time
        """, device_id, from_dt, to_dt, radius_meters, min_duration_sec)

    stops = [
        {
            "start_time":   row["start_time"].isoformat(),
            "end_time":     row["end_time"].isoformat(),
            "duration_min": float(row["duration_min"]),
            "latitude":     float(row["latitude"]),
            "longitude":    float(row["longitude"]),
            "label": (
                f"⏸ Detenida de {row['start_time'].strftime('%H:%M')} "
                f"a {row['end_time'].strftime('%H:%M')} "
                f"({float(row['duration_min']):.0f} min)"
            )
        }
        for row in stops_rows
    ]

    return {
        "device_id":        device_id,
        "device_name":      device["name"],
        "from_date":        from_dt.isoformat(),
        "to_date":          to_dt.isoformat(),
        "radius_meters":    radius_meters,
        "min_duration_min": min_duration_min,
        "total_stops":      len(stops),
        "stops":            stops
    }


@app.get("/api/daily-stats")
async def get_daily_stats(
    device_id: int = Query(..., description="ID del dispositivo"),
    from_date: str = Query(..., description="Fecha inicio YYYY-MM-DD"),
    to_date:   str = Query(..., description="Fecha fin YYYY-MM-DD"),
):
    """
    Resumen diario de actividad usando la Continuous Aggregate mv_daily_device_stats.
    Ultra-rápido: lee datos pre-calculados, no escanea tc_positions.
    """
    try:
        from_dt = parse_naive_utc(from_date)
        to_dt   = parse_naive_utc(to_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato inválido. Use YYYY-MM-DD o ISO-8601")

    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch("""
            SELECT
                day,
                total_points,
                stopped_points,
                moving_points,
                max_speed_kmh,
                avg_speed_kmh,
                first_point,
                last_point
            FROM mv_daily_device_stats
            WHERE deviceid = $1
              AND day BETWEEN $2 AND $3
            ORDER BY day
        """, device_id, from_dt, to_dt)

    return {
        "device_id": device_id,
        "days": [
            {
                "day":             row["day"].strftime("%Y-%m-%d"),
                "total_points":    row["total_points"],
                "stopped_points":  row["stopped_points"],
                "moving_points":   row["moving_points"],
                "max_speed_kmh":   float(row["max_speed_kmh"] or 0),
                "avg_speed_kmh":   float(row["avg_speed_kmh"] or 0),
                "active_from":     row["first_point"].strftime("%H:%M") if row["first_point"] else None,
                "active_until":    row["last_point"].strftime("%H:%M")  if row["last_point"]  else None,
            }
            for row in rows
        ]
    }

# HTML Frontend Response
@app.get("/", response_class=HTMLResponse)
async def index():
    html_content = """
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GPS D-MUJERES - Realtime Debug Panel</title>
    <!-- Google Fonts Outfit & Inter -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #07090e;
            --card-bg: rgba(13, 18, 30, 0.45);
            --card-border: rgba(59, 130, 246, 0.12);
            --card-border-hover: rgba(59, 130, 246, 0.3);
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-dim: #64748b;
            
            --color-cyan: #06b6d4;
            --color-emerald: #10b981;
            --color-violet: #8b5cf6;
            --color-amber: #f59e0b;
            --color-rose: #f43f5e;
            
            --cyan-glow: rgba(6, 182, 212, 0.15);
            --emerald-glow: rgba(16, 185, 129, 0.15);
            --violet-glow: rgba(139, 92, 246, 0.15);
            --amber-glow: rgba(245, 158, 11, 0.15);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Inter', sans-serif;
            background-color: var(--bg-color);
            color: var(--text-primary);
            min-height: 100vh;
            padding: 24px;
            overflow-x: hidden;
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(6, 182, 212, 0.04) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(139, 92, 246, 0.04) 0%, transparent 40%);
        }

        h1, h2, h3 {
            font-family: 'Outfit', sans-serif;
            font-weight: 600;
        }

        /* Layout */
        .container {
            max-width: 1400px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 24px;
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            backdrop-filter: blur(12px);
        }

        .header-title {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .pulse-dot {
            width: 10px;
            height: 10px;
            background-color: var(--color-emerald);
            border-radius: 50%;
            box-shadow: 0 0 12px var(--color-emerald);
            animation: pulse 2s infinite;
        }

        @keyframes pulse {
            0% { transform: scale(0.9); opacity: 0.6; }
            50% { transform: scale(1.1); opacity: 1; box-shadow: 0 0 16px var(--color-emerald); }
            100% { transform: scale(0.9); opacity: 0.6; }
        }

        .sys-status {
            font-size: 14px;
            color: var(--color-emerald);
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        /* Dashboard Grid */
        .grid-kpis {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
        }

        .card {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 24px;
            backdrop-filter: blur(12px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }

        .card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 4px; height: 100%;
        }

        .card-cyan::before { background-color: var(--color-cyan); }
        .card-emerald::before { background-color: var(--color-emerald); }
        .card-violet::before { background-color: var(--color-violet); }
        .card-amber::before { background-color: var(--color-amber); }

        .card:hover {
            border-color: var(--card-border-hover);
            transform: translateY(-2px);
        }

        .card-title {
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: var(--text-secondary);
            margin-bottom: 8px;
        }

        .card-value {
            font-family: 'Outfit', sans-serif;
            font-size: 36px;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .card-meta {
            font-size: 12px;
            color: var(--text-dim);
            display: flex;
            justify-content: space-between;
        }

        /* Large Sections */
        .sections-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 24px;
        }

        @media (max-width: 1024px) {
            .sections-row {
                grid-template-columns: 1fr;
            }
        }

        .panel {
            background: var(--card-bg);
            border: 1px solid var(--card-border);
            border-radius: 16px;
            padding: 20px;
            backdrop-filter: blur(12px);
            display: flex;
            flex-direction: column;
            gap: 16px;
            max-height: 450px;
        }

        .panel-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding-bottom: 12px;
        }

        .panel-title {
            font-size: 16px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .badge-count {
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 11px;
            font-weight: 600;
        }

        .badge-cyan { background: rgba(6, 182, 212, 0.1); color: var(--color-cyan); }
        .badge-violet { background: rgba(139, 92, 246, 0.1); color: var(--color-violet); }
        
        .table-container {
            overflow-y: auto;
            flex: 1;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        th {
            text-align: left;
            padding: 10px 12px;
            color: var(--text-secondary);
            font-weight: 500;
            border-bottom: 1px solid rgba(255,255,255,0.04);
        }

        td {
            padding: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.03);
            color: var(--text-primary);
        }

        tr:hover td {
            background: rgba(255,255,255,0.01);
        }

        .badge-status {
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
        }

        .status-online { background: rgba(16, 185, 129, 0.15); color: var(--color-emerald); }
        .status-offline { background: rgba(244, 63, 94, 0.15); color: var(--color-rose); }
        .status-admin { background: rgba(139, 92, 246, 0.15); color: var(--color-violet); }

        /* Terminal Logs Section */
        .terminal-panel {
            background: #020408;
            border: 1px solid #1e293b;
            border-radius: 16px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .terminal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid #1e293b;
            padding-bottom: 12px;
        }

        .terminal-controls {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .btn {
            background: #0f172a;
            border: 1px solid #334155;
            color: var(--text-secondary);
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
            font-weight: 500;
        }

        .btn:hover {
            background: #1e293b;
            color: var(--text-primary);
            border-color: #475569;
        }

        .select-limit {
            background: #0f172a;
            border: 1px solid #334155;
            color: var(--text-secondary);
            padding: 5px 8px;
            border-radius: 6px;
            font-size: 12px;
            outline: none;
        }

        .terminal-body {
            background: #030712;
            border: 1px solid #0f172a;
            border-radius: 8px;
            padding: 16px;
            height: 350px;
            overflow-y: auto;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.6;
            color: #e2e8f0;
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .log-line {
            white-space: pre-wrap;
            word-break: break-all;
            border-left: 2px solid transparent;
            padding-left: 8px;
        }

        .log-info { border-color: var(--color-cyan); color: #38bdf8; }
        .log-warn { border-color: var(--color-amber); color: #fbbf24; }
        .log-error { border-color: var(--color-rose); color: #f87171; }
        .log-system { border-color: var(--text-dim); color: var(--text-dim); }

    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <header>
            <div class="header-title">
                <div class="pulse-dot"></div>
                <h2>D-MUJERES GPS — Terminal de Debug</h2>
            </div>
            <div class="sys-status" id="connection-status">
                <span>Conectado a PostgreSQL</span>
            </div>
        </header>

        <!-- KPIs Base de Datos -->
        <div class="grid-kpis">
            <div class="card card-cyan">
                <div class="card-title">Registros GPS</div>
                <div class="card-value" id="kpi-positions">—</div>
                <div class="card-meta">
                    <span id="kpi-positions-size">Peso: —</span>
                    <span id="kpi-positions-chunks">Hypertable: — chunks</span>
                </div>
            </div>
            <div class="card card-emerald">
                <div class="card-title">Colaboradores Activos</div>
                <div class="card-value" id="kpi-devices">—</div>
                <div class="card-meta">
                    <span id="kpi-devices-status">En línea / Total</span>
                    <span>Categoría: person</span>
                </div>
            </div>
            <div class="card card-violet">
                <div class="card-title">Eventos y Alertas</div>
                <div class="card-value" id="kpi-events">—</div>
                <div class="card-meta">
                    <span id="kpi-events-size">Peso: —</span>
                    <span>Hypertable: 30d chunks</span>
                </div>
            </div>
            <div class="card card-amber">
                <div class="card-title">Conexiones DB</div>
                <div class="card-value" id="kpi-connections">—</div>
                <div class="card-meta">
                    <span id="kpi-postgres-version">PG: —</span>
                    <span id="kpi-timescale-version">TS: —</span>
                </div>
            </div>
        </div>

        <!-- Tables Row -->
        <div class="sections-row">
            <!-- Panel Usuarios -->
            <div class="panel">
                <div class="panel-header">
                    <span class="panel-title">Usuarios del Sistema</span>
                    <span class="badge-count badge-violet" id="badge-users-count">0</span>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Límite Dispositivos</th>
                            </tr>
                        </thead>
                        <tbody id="table-users-body">
                            <tr>
                                <td colspan="4" style="text-align:center; color:var(--text-dim)">Cargando...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Panel Colaboradores -->
            <div class="panel">
                <div class="panel-header">
                    <span class="panel-title">Colaboradores (Dispositivos)</span>
                    <span class="badge-count badge-cyan" id="badge-devices-count">0</span>
                </div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre / Cargo</th>
                                <th>Identificación ID</th>
                                <th>Teléfono</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody id="table-devices-body">
                            <tr>
                                <td colspan="4" style="text-align:center; color:var(--text-dim)">Cargando...</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        <!-- Live Terminal logs -->
        <div class="terminal-panel">
            <div class="terminal-header">
                <span class="panel-title" style="display:flex; align-items:center; gap:8px;">
                    <span style="color:var(--color-amber)">⬤</span> Logs de Traccar en Vivo (tracker-server.log)
                </span>
                <div class="terminal-controls">
                    <select class="select-limit" id="log-limit-select" onchange="fetchLogs()">
                        <option value="50">50 líneas</option>
                        <option value="100" selected>100 líneas</option>
                        <option value="150">150 líneas</option>
                        <option value="200">200 líneas</option>
                    </select>
                    <button class="btn" onclick="fetchLogs()">Refrescar</button>
                </div>
            </div>
            <div class="terminal-body" id="terminal-screen">
                <div class="log-line log-system">Iniciando streaming de logs de Traccar...</div>
            </div>
        </div>
    </div>

    <script>
        async function fetchDbStatus() {
            try {
                const res = await fetch('/dmujeres-traccar-debug/api/db-status');
                const data = await res.json();
                
                // KPIs
                document.getElementById('kpi-positions').textContent = data.counts.positions.toLocaleString();
                document.getElementById('kpi-positions-size').textContent = 'Peso: ' + (data.sizes.tc_positions?.size || '—');
                const posHyper = data.hypertables.find(h => h.name === 'tc_positions');
                document.getElementById('kpi-positions-chunks').textContent = 'Hypertable: ' + (posHyper?.chunks || 0) + ' chunks';
                
                document.getElementById('kpi-events').textContent = data.counts.events.toLocaleString();
                document.getElementById('kpi-events-size').textContent = 'Peso: ' + (data.sizes.tc_events?.size || '—');
                
                document.getElementById('kpi-connections').textContent = data.database.active_connections;
                document.getElementById('kpi-postgres-version').textContent = 'PG: ' + data.database.version.split(',')[0].replace('PostgreSQL ', '').substring(0, 8);
                document.getElementById('kpi-timescale-version').textContent = 'TS: ' + data.database.timescaledb_version;

                document.getElementById('connection-status').innerHTML = '<span class="pulse-dot"></span> <span>Conectado a PostgreSQL</span>';
                document.getElementById('connection-status').style.color = 'var(--color-emerald)';
            } catch (err) {
                console.error(err);
                document.getElementById('connection-status').textContent = 'Error de conexión a DB';
                document.getElementById('connection-status').style.color = 'var(--color-rose)';
            }
        }

        async function fetchUsers() {
            try {
                const res = await fetch('/dmujeres-traccar-debug/api/users');
                const users = await res.json();
                
                document.getElementById('badge-users-count').textContent = users.length;
                const tbody = document.getElementById('table-users-body');
                tbody.innerHTML = '';
                
                users.forEach(u => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${u.name || '—'}</td>
                        <td>${u.email}</td>
                        <td>
                            <span class="badge-status ${u.administrator ? 'status-admin' : 'status-offline'}">
                                ${u.administrator ? 'Admin' : 'Usuario'}
                            </span>
                        </td>
                        <td>${u.devicelimit === -1 ? 'Ilimitado' : u.devicelimit}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (err) {
                console.error(err);
            }
        }

        async function fetchDevices() {
            try {
                const res = await fetch('/dmujeres-traccar-debug/api/devices');
                const devices = await res.json();
                
                document.getElementById('badge-devices-count').textContent = devices.length;
                document.getElementById('kpi-devices').textContent = devices.length;
                
                const onlineCount = devices.filter(d => d.status === 'online').length;
                document.getElementById('kpi-devices-status').textContent = onlineCount + ' En línea / ' + devices.length + ' Total';

                const tbody = document.getElementById('table-devices-body');
                tbody.innerHTML = '';
                
                if (devices.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-dim)">Sin colaboradores registrados.</td></tr>';
                    return;
                }

                devices.forEach(d => {
                    const tr = document.createElement('tr');
                    const isOnline = d.status === 'online';
                    tr.innerHTML = `
                        <td>
                            <div style="font-weight:600;">${d.name}</div>
                            <div style="font-size:11px; color:var(--text-dim)">Icono: ${d.category || 'person'}</div>
                        </td>
                        <td>${d.uniqueid}</td>
                        <td>${d.phone || '—'}</td>
                        <td>
                            <span class="badge-status ${isOnline ? 'status-online' : 'status-offline'}">
                                ${isOnline ? 'En línea' : 'Desconectado'}
                            </span>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            } catch (err) {
                console.error(err);
            }
        }

        let lastLogsJSON = '';
        async function fetchLogs() {
            try {
                const limit = document.getElementById('log-limit-select').value;
                const res = await fetch('/dmujeres-traccar-debug/api/logs?limit=' + limit);
                const data = await res.json();
                
                // Compare to prevent flickering if nothing changed
                const logsJSON = JSON.stringify(data.logs);
                if (logsJSON === lastLogsJSON) return;
                lastLogsJSON = logsJSON;
                
                const screen = document.getElementById('terminal-screen');
                screen.innerHTML = '';
                
                data.logs.forEach(line => {
                    const div = document.createElement('div');
                    div.className = 'log-line';
                    div.textContent = line;
                    
                    if (line.includes('INFO:')) {
                        div.classList.add('log-info');
                    } else if (line.includes('WARN:')) {
                        div.classList.add('log-warn');
                    } else if (line.includes('ERROR:')) {
                        div.classList.add('log-error');
                    } else {
                        div.classList.add('log-system');
                    }
                    
                    screen.appendChild(div);
                });
                
                // Auto scroll to bottom
                screen.scrollTop = screen.scrollHeight;
            } catch (err) {
                console.error(err);
            }
        }

        // Initial fetch
        fetchDbStatus();
        fetchUsers();
        fetchDevices();
        fetchLogs();

        // Polling intervals
        setInterval(fetchDbStatus, 5000);
        setInterval(fetchDevices, 5000);
        setInterval(fetchLogs, 2000); // Poll logs every 2 seconds for real-time feel
    </script>
</body>
</html>
    """
    return html_content
