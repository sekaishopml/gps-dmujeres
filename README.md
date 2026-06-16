# D-MUJERES TRACCAR

Plataforma de Rastreo de Flotas GPS con Arquitectura de Microservicios

## Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                   Traccar Client (iOS/Android)           │
│              Protocolo OsmAnd → Puerto 5055             │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│              Nginx (Proxy Inverso + SSL)                 │
│            Puerto 80/443 → Balanceo Interno             │
└────┬──────────────┬──────────────────┬──────────────────┘
     │              │                  │
     ▼              ▼                  ▼
┌─────────┐  ┌───────────┐  ┌─────────────────┐
│Ingestor │  │  API REST │  │ Dashboard React │
│Node.js  │  │  FastAPI  │  │ Leaflet + Vite  │
│:5055    │  │  :8000    │  │ :80 (interno)   │
└────┬────┘  └─────┬─────┘  └─────────────────┘
     │              │
     ▼              ▼
┌──────────────┐  ┌───────┐
│ PostgreSQL   │  │ Redis │
│ +TimescaleDB │  │ Caché │
│ + PostGIS    │  │       │
└──────────────┘  └───────┘
```

## Stack Tecnológico

| Componente | Tecnología | Puerto |
|-----------|-----------|--------|
| **Ingesta GPS** | Node.js 20 + Express | 5055 |
| **API Lectura** | Python 3.12 + FastAPI | 8000 |
| **Base de Datos** | PostgreSQL 16 + TimescaleDB 2.x + PostGIS | 5432 |
| **Caché** | Redis 7 | 6379 |
| **Dashboard** | React 18 + Vite + Leaflet | 3000 (80 interno) |
| **Proxy** | Nginx Alpine | 80, 443 |

## Requisitos

- Docker 24+ y Docker Compose v2+
- 2 GB RAM mínimo (4 GB recomendado)
- 20 GB de disco (para ~40M registros/año con compresión)

## Instalación Rápida

```bash
# 1. Clonar el repositorio
cd /home/D-MUJERES-TRACCAR

# 2. Copiar y configurar variables de entorno
cp .env.example .env
nano .env  # Ajustar contraseñas y dominio

# 3. Levantar todos los servicios
docker compose up -d

# 4. Verificar estado
docker compose ps
curl http://localhost:8000/health
curl http://localhost:5055/health
```

## Acceso a los Servicios

| Servicio | URL Local |
|----------|-----------|
| Dashboard | http://localhost:3000 |
| API REST | http://localhost:8000 |
| Ingestor | http://localhost:5055/health |
| Documentación API | http://localhost:8000/docs (Swagger) |

## Configurar Traccar Client (App Móvil)

En la app Traccar Client (iOS/Android), cambiar la URL del servidor:

```
http://TU_SERVIDOR:5055
```

La app enviará automáticamente coordenadas con el formato OsmAnd que nuestro ingestor procesa.

## Endpoints API

### Health Check
```
GET /health
```

### Dispositivos
```
GET /api/devices              → Listar todos los dispositivos
GET /api/devices/{id}         → Detalle de un dispositivo
```

### Posiciones GPS
```
GET /api/positions/{device_id}?from_date=...&to_date=...&format=geojson
```

### Rutas Pre-calculadas (desde Redis)
```
GET /api/route/{device_id}/{date}   → YYYY-MM-DD
```

### Estadísticas de Ruta
```
GET /api/stats/{device_id}?from_date=...&to_date=...
```

### Caché
```
GET /api/cache/stats
```

## Estructura del Proyecto

```
D-MUJERES-TRACCAR/
├── docker-compose.yml          # Orquestación de servicios
├── .env.example                # Variables de entorno
├── .gitignore
├── README.md                   # Este archivo
├── nginx/                      # Proxy inverso
│   ├── nginx.conf
│   └── conf.d/
│       └── default.conf
├── ingestor/                   # Microservicio de ingesta
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Servidor Express :5055
│       ├── parser.js           # Decodificador OsmAnd
│       └── db.js               # Pool PostgreSQL
├── api/                        # API REST de lectura
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # FastAPI endpoints
│       ├── models.py           # Esquemas Pydantic
│       └── cache.py            # Integración Redis
├── frontend/                   # Dashboard React
│   ├── Dockerfile
│   ├── nginx-frontend.conf
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── index.css
│       ├── App.jsx
│       └── services/
│           └── api.js
└── scripts/                    # Utilidades
    ├── setup-timescaledb.sql   # Inicialización BD
    ├── precompute-routes.js    # Cron nocturno
    └── Dockerfile.cron
```

## Base de Datos: TimescaleDB

### Hypertable `tc_positions`
- Particionado por tiempo: chunks de 7 días
- Compresión automática a los 7 días (~90% ahorro)
- Retención: 2 años (configurable)
- Índices: GIN (JSONB), GIST (geoespacial), compuesto (device_id, time)

### Consulta de ejemplo
```sql
-- Ruta de un vehículo en una fecha (usa solo los chunks relevantes)
SELECT ST_MakeLine(geog::geometry ORDER BY time ASC)
FROM tc_positions
WHERE device_id = 1
  AND time >= '2026-01-01'::timestamptz
  AND time < '2026-01-02'::timestamptz;
```

## Registro de Dispositivos

Los dispositivos se registran automáticamente al recibir su primer paquete de datos. Para gestionarlos manualmente:

```sql
-- Conectarse a PostgreSQL
docker compose exec timescaledb psql -U dmt_admin -d dmtracker

-- Insertar un dispositivo nuevo
INSERT INTO tc_devices (device_uid, name, plate, driver_name)
VALUES ('123456', 'Taxi 01', 'ABC-1234', 'Juan Pérez');

-- Ver todos los dispositivos
SELECT * FROM tc_devices;
```

## Monitoreo

```bash
# Ver logs de todos los servicios
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f ingestor
docker compose logs -f api

# Estadísticas de TimescaleDB
docker compose exec timescaledb psql -U dmt_admin -d dmtracker -c "
SELECT hypertable_name, 
       pg_size_pretty(hypertable_size('tc_positions'::regclass)) AS size,
       compression_enabled
FROM timescaledb_information.hypertables;
"

# Número de chunks
docker compose exec timescaledb psql -U dmt_admin -d dmtracker -c "
SELECT count(*) AS chunks FROM timescaledb_information.chunks
WHERE hypertable_name = 'tc_positions';
"
```

## Resolución de Problemas

### El ingestor no recibe datos
1. Verificar que el puerto 5055 está expuesto: `docker compose ps`
2. Revisar logs: `docker compose logs ingestor`
3. Probar manualmente: `curl "http://localhost:5055/?id=123456&lat=-2.18&lon=-79.88&timestamp=$(date +%s)"`

### El Dashboard no muestra rutas
1. Verificar API: `curl http://localhost:8000/api/devices`
2. Verificar que hay datos en la BD: conectar a psql y hacer SELECT COUNT(*)
3. Ejecutar cron manual: `docker compose exec cron node precompute-routes.js`

### Lentitud en consultas después de meses
- Verificar políticas de compresión: las chunks antiguas deben estar comprimidas
- Verificar índices: `\di tc_positions*`
- Aumentar `shared_buffers` en docker-compose.yml si hay RAM disponible

## Licencia

Proyecto privado - D-MUJERES TRACCAR © 2026