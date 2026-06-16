# HANDOFF TÉCNICO — D-MUJERES TRACCAR

## Documento de Entrega para Programador Entrante

**Proyecto:** D-MUJERES TRACCAR — Plataforma de Rastreo de Flotas GPS  
**Contenido:** Bugs conocidos, deuda técnica, pendientes, guía de depuración

---

## Índice

1. [Cómo empezar](#1-cómo-empezar)
2. [Estructura del proyecto](#2-estructura-del-proyecto)
3. [Bugs críticos a resolver 🔴](#3-bugs-críticos-a-resolver-)
4. [Bugs medios a resolver 🟡](#4-bugs-medios-a-resolver-)
5. [Deuda técnica 🟢](#5-deuda-técnica-)
6. [Checklist de tareas pendientes](#6-checklist-de-tareas-pendientes)
7. [Guía de depuración rápida](#7-guía-de-depuración-rápida)
8. [Arquitectura y flujo de datos](#8-arquitectura-y-flujo-de-datos)
9. [Referencia de endpoints API](#9-referencia-de-endpoints-api)
10. [Problemas comunes y soluciones](#10-problemas-comunes-y-soluciones)

---

## 1. Cómo Empezar

```bash
# 1. Ir al proyecto
cd /home/D-MUJERES-TRACCAR

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales seguras

# 3. Verificar Docker
docker --version
docker compose version

# 4. Iniciar servicios
docker compose up -d --build

# 5. Verificar estado
docker compose ps

# 6. Inicializar base de datos (si es primera vez)
docker compose exec -T timescaledb psql -U dmt_admin -d dmtracker < scripts/setup-timescaledb.sql

# 7. Verificar health
curl http://localhost:8000/health
curl http://localhost:5055/health
```

### Puertos del sistema

| Servicio | Puerto | Acceso |
|----------|--------|--------|
| Ingestor GPS (OsmAnd) | 5055 | Público (apps móviles) |
| API REST | 8000 | Localhost |
| Dashboard | 3001 | Localhost |
| Nginx (proxy) | 8080 | Público |
| PostgreSQL | 5433 | Localhost (5432 interno) |
| Redis | 6379 | Localhost |

---

## 2. Estructura del Proyecto

```
/home/D-MUJERES-TRACCAR/
├── docker-compose.yml          # Orquestación (7 servicios)
├── .env / .env.example         # Variables de entorno
├── README.md                   # Documentación general
├── INFORME_TECNICO.md          # Informe ejecutivo
├── HANDOFF.md                  # ⬅️ Este documento
│
├── ingestor/                   # 🔴 BUG AQUÍ - Microservicio Node.js
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js            # Punto de entrada Express
│       ├── parser.js           # Decodificador protocolo OsmAnd
│       └── db.js               # 🔴 Pool PostgreSQL + queries
│
├── api/                        # 🟡 BUG AQUÍ - API REST FastAPI
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py             # Endpoints + lógica
│       ├── models.py           # Schemas Pydantic
│       └── cache.py            # Redis cache client
│
├── frontend/                   # Dashboard React
│   ├── Dockerfile
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx             # Componente principal
│       ├── index.css           # Estilos (tema oscuro)
│       └── services/api.js     # Cliente HTTP
│
├── nginx/                      # Proxy inverso
│   ├── nginx.conf
│   └── conf.d/default.conf     # Config de sitio
│
└── scripts/                    # Utilidades
    ├── setup-timescaledb.sql   # Inicialización BD
    ├── precompute-routes.js    # Cron nocturno
    └── Dockerfile.cron
```

---

## 3. Bugs Críticos a Resolver 🔴

### Bug 1: Ingestor no guarda datos en BD

**Síntoma:** El ingestor responde `{"ok":true,"positions":1}` pero al consultar la API no hay registros.

**Causa raíz:** El código en el contenedor Docker del ingestor **no está actualizado**. Los archivos `db.js` e `index.js` en disco tienen correcciones (eliminar columna `geog`, auto-registro de dispositivos) pero Docker no puede rebuildear porque el registry `docker.io` está bloqueado.

**Solución temporal** (copiar archivos al contenedor):
```bash
docker cp /home/D-MUJERES-TRACCAR/ingestor/src/db.js dmt-ingestor:/app/src/db.js
docker cp /home/D-MUJERES-TRACCAR/ingestor/src/index.js dmt-ingestor:/app/src/index.js
docker container restart dmt-ingestor
```

**Solución permanente** (habilitar Docker registry):
```bash
# Verificar conectividad
curl -I https://registry.docker.io
# Si falla, probar con mirror:
echo '{"registry-mirrors": ["https://mirror.gcr.io"]}' > /etc/docker/daemon.json
systemctl restart docker
# Luego rebuild:
cd /home/D-MUJERES-TRACCAR && docker compose build --no-cache ingestor && docker compose up -d ingestor
```

**Verificar que funciona:**
```bash
TIMESTAMP=$(date +%s)
curl "http://localhost:5055/?id=TEST001&lat=-2.1894&lon=-79.8891&timestamp=$TIMESTAMP&speed=40&bearing=180&altitude=100&accuracy=10&battery=85&charging=true"
# Debe responder: {"ok":true,"positions":1}

sleep 3
curl "http://localhost:8000/api/devices"
# Debe mostrar el dispositivo TEST001 registrado

curl "http://localhost:8000/api/positions/1?from_date=2026-01-01T00:00:00&to_date=2026-12-31T23:59:59&format=json"
# Debe mostrar la posición insertada
```

### Bug 2: API `/api/stats` falla con error `geog`

**Síntoma:** `GET /api/stats/{device_id}` devuelve Internal Server Error.

**Causa:** La query SQL en `main.py` (función `calculate_stats`) usa `geog::geometry` que requiere la extensión PostGIS, pero la imagen `timescale/timescaledb:latest-pg16` no incluye PostGIS.

**Solución inmutable** (cambiar la query para no usar `geog`):
```python
# En main.py, función calculate_stats, reemplazar:
# ST_Length(ST_MakeLine(geog::geometry ORDER BY time ASC)::geography)
# Con:
# ST_Length(ST_MakeLine(ST_MakePoint(longitude, latitude)::geometry ORDER BY time ASC)::geography)
```

Ya está el código listo en disco, solo falta actualizar el contenedor. Para hacerlo:
```bash
docker cp /home/D-MUJERES-TRACCAR/api/app/main.py dmt-api:/app/app/main.py
docker container restart dmt-api
```

---

## 4. Bugs Medios a Resolver 🟡

### Bug 3: PostGIS no instalado (dependencia opcional)

La tabla `tc_positions` fue creada **sin** la columna `geog` (GEOGRAPHY). Para funcionalidad geoespacial avanzada:

```bash
docker compose exec -T timescaledb apt-get update && docker compose exec -T timescaledb apt-get install -y postgresql-16-postgis-3
docker compose exec -T timescaledb psql -U dmt_admin -d dmtracker -c "CREATE EXTENSION postgis;"
docker compose exec -T timescaledb psql -U dmt_admin -d dmtracker -c "
  ALTER TABLE tc_positions ADD COLUMN IF NOT EXISTS geog GEOGRAPHY(Point,4326);
  UPDATE tc_positions SET geog = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326);
  CREATE INDEX IF NOT EXISTS idx_positions_geog ON tc_positions USING GIST (geog);
"
```

### Bug 4: Dashboard no conectado a la API

El frontend React tiene el proxy configurado para desarrollo (`http://localhost:8000/api`), pero en producción necesita la variable `VITE_API_URL`. Verificar que en `docker-compose.yml` esté configurada:

```yaml
frontend:
  environment:
    VITE_API_URL: http://localhost:8000
```

---

## 5. Deuda Técnica 🟢

### Warnings de Pylance (no bloqueantes)

Los siguientes errores son warnings de tipo que **no afectan la ejecución** pero deben corregirse:

1. **`cache.py:80`** — `ttl: int = None` debería ser `ttl: int | None = None` ✅ *Ya corregido*
2. **`main.py:48`** — Tipo retorno `get_pool()`: añadir `assert db_pool is not None` ✅ *Ya corregido*
3. **`main.py:453,458`** — `isoformat()` en campo nullable: ya tiene guardianes `if hasattr` 
4. **`main.py:127`** — `ST_MakeLine(geog::geometry)` requiere PostGIS

### Mejoras pendientes

1. **Tests automatizados**: No hay tests unitarios ni de integración
2. **Logging estructurado**: Usar JSON logging para mejor integración con herramientas de monitoreo
3. **Rate limiting en API**: Nginx rate limita el ingestor pero no la API
4. **Health checks más robustos**: El health del API depende de Redis y BD
5. **Migraciones de BD**: Usar Alembic o similar para versionar cambios de esquema
6. **CI/CD**: No hay pipeline de integración continua
7. **Observabilidad**: Agregar métricas Prometheus en FastAPI

---

## 6. Checklist de Tareas Pendientes

### Fase 6: Estabilización (3-5 días)

- [ ] **Bug 1**: Copiar archivos al contenedor ingestor y verificar persistencia
- [ ] **Bug 2**: Corregir query `geog` en API y copiar al contenedor
- [ ] **Bug 3**: Instalar PostGIS o eliminar dependencia `geog`
- [ ] **Prueba ciclo completo**: 
  ```bash
  # 1. Enviar posición GPS
  TIMESTAMP=$(date +%s)
  curl "http://localhost:5055/?id=TEST001&lat=-2.1894&lon=-79.8891&timestamp=$TIMESTAMP&speed=40"
  # 2. Verificar en BD
  docker compose exec timescaledb psql -U dmt_admin -d dmtracker -c "SELECT count(*) FROM tc_positions;"
  # 3. Consultar por API
  curl "http://localhost:8000/api/devices"
  curl "http://localhost:8000/api/positions/1?from_date=2026-01-01T00:00:00&to_date=2026-12-31T23:59:59&format=json"
  ```
- [ ] **Corregir warnings Pylance** (4 archivos)
- [ ] **Agregar test de inserción masiva**: simular 1000 posiciones

### Fase 7: Producción (5-7 días)

- [ ] **SSL**: Configurar Let's Encrypt con certbot
  ```bash
  docker compose exec nginx certbot --nginx -d tracking.dominio.com
  ```
- [ ] **Backups diarios**: 
  ```bash
  # Crear script en scripts/backup-db.sh
  docker compose exec -T timescaledb pg_dump -U dmt_admin dmtracker > /backups/dmtracker_$(date +%Y%m%d).sql
  ```
- [ ] **Firewall**: ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 5055/tcp
- [ ] **Monitoreo**: Instalar netdata o prometheus-node-exporter
- [ ] **Logs centralizados**: Configurar Docker logging driver → journald o Loki

### Fase 8: Dashboard (2-3 semanas)

- [ ] Selector múltiple de vehículos en el mapa
- [ ] Exportación de rutas (PDF, CSV, GeoJSON)
- [ ] Filtros: por placa, conductor, fecha personalizada
- [ ] Alertas de velocidad, batería baja, geocercas
- [ ] Panel de administración (CRUD vehículos/conductores)
- [ ] Autenticación de usuarios

### Fase 9: Avanzado (2-4 semanas)

- [ ] Geocercas con WebSocket
- [ ] Reportes automáticos por email
- [ ] App móvil custom (Flutter/React Native)
- [ ] Integración Google Maps/Waze
- [ ] ML para predicción de rutas

---

## 7. Guía de Depuración Rápida

### Ver estado de servicios
```bash
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
```

### Ver logs de un servicio
```bash
docker compose logs -f ingestor   # Últimos logs + seguir
docker compose logs api --tail 50 # Últimas 50 líneas
docker compose logs nginx         # Errores de proxy
```

### Ver datos en PostgreSQL
```bash
docker compose exec timescaledb psql -U dmt_admin -d dmtracker -c "\dt"
docker compose exec timescaledb psql -U dmt_admin -d dmtracker -c "SELECT count(*) FROM tc_positions;"
docker compose exec timescaledb psql -U dmt_admin -d dmtracker -c "SELECT * FROM tc_devices;"
```

### Ver caché Redis
```bash
docker compose exec redis redis-cli KEYS 'route:*'
docker compose exec redis redis-cli DBSIZE
```

### Probar ingesta manual (simula Traccar Client)
```bash
TIMESTAMP=$(date +%s)
curl -v "http://localhost:5055/?id=TAXI001&lat=-2.2024&lon=-79.8691&timestamp=$TIMESTAMP&speed=35&bearing=270&altitude=50&accuracy=8&battery=72&charging=false"
```

### Probar API endpoints
```bash
curl http://localhost:8000/health
curl http://localhost:8000/api/devices
curl http://localhost:8000/api/positions/1?from_date=2026-01-01T00:00:00&to_date=2026-12-31T23:59:59&format=json
curl http://localhost:8000/api/route/1/2026-01-15
curl http://localhost:8000/api/stats/1?from_date=2026-01-01T00:00:00&to_date=2026-01-31T23:59:59
```

---

## 8. Arquitectura y Flujo de Datos

```
                    ┌───────────────┐
                    │  Traccar Client│
                    │ (iOS/Android) │
                    └───────┬───────┘
                            │ GET /?id=X&lat=Y&lon=Z...
                            │ Protocolo OsmAnd
                            ▼
                    ┌───────────────┐
                    │   Nginx :80   │
                    │ Proxy inverso │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  Ingestor     │
                    │  Node.js      │
                    │  Puerto 5055  │
                    │               │
                    │  1. Parsear   │
                    │  2. Auto-reg  │
                    │  3. Insert    │
                    └───────┬───────┘
                            │ INSERT
                            ▼
                    ┌───────────────┐
                    │  TimescaleDB  │
                    │  tc_positions │
                    │  (Hypertable) │
                    └───────┬───────┘
                            │ SELECT
                            ▼
                    ┌───────────────┐     ┌───────────────┐
                    │   API REST    │◄────│    Redis       │
                    │   FastAPI     │     │   (Caché)      │
                    │   Puerto 8000 │     └───────────────┘
                    └───────┬───────┘
                            │ JSON/GeoJSON
                            ▼
                    ┌───────────────┐
                    │   Dashboard   │
                    │   React +     │
                    │   Leaflet     │
                    │   Puerto 3001 │
                    └───────────────┘
```

### Flujo nocturno (Cron)
```
                    ┌───────────────┐
                    │    Cron       │
                    │  3:00 AM      │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  Query BD     │
                    │  Ruta de ayer │
                    └───────┬───────┘
                            │
                    ┌───────▼───────┐
                    │  Comprimir    │
                    │  Guardar en   │
                    │  Redis (TTL)  │
                    └───────────────┘
```

---

## 9. Referencia de Endpoints API

| Método | Ruta | Descripción | Ejemplo |
|--------|------|-------------|---------|
| GET | `/health` | Health check | `curl localhost:8000/health` |
| GET | `/api/devices` | Listar dispositivos | `curl localhost:8000/api/devices` |
| GET | `/api/devices/{id}` | Detalle dispositivo | `curl localhost:8000/api/devices/1` |
| GET | `/api/positions/{id}?from_date=...&to_date=...` | Posiciones GPS | `curl localhost:8000/api/positions/1?from_date=2026-01-01T00:00:00&to_date=2026-01-02T00:00:00` |
| GET | `/api/route/{id}/{date}` | Ruta pre-calculada | `curl localhost:8000/api/route/1/2026-01-15` |
| GET | `/api/stats/{id}?from_date=...&to_date=...` | Estadísticas | `curl localhost:8000/api/stats/1?from_date=2026-01-01T00:00:00&to_date=2026-01-31T23:59:59` |
| GET | `/api/cache/stats` | Stats caché Redis | `curl localhost:8000/api/cache/stats` |

### Parámetros comunes

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `from_date` | ISO 8601 | Requerido | Fecha inicio (ej: 2026-01-01T00:00:00) |
| `to_date` | ISO 8601 | Requerido | Fecha fin |
| `limit` | int | 10000 | Máx puntos (max 50000) |
| `format` | string | "geojson" | "json" o "geojson" |
| `simplified` | bool | false | Simplificar ruta (Douglas-Peucker) |
| `tolerance` | float | 0.0001 | Tolerancia simplificación |

---

## 10. Problemas Comunes y Soluciones

| Problema | Causa | Solución |
|----------|-------|----------|
| `docker: command not found` | Docker no instalado | `apt install docker.io docker-compose-v2` |
| `port already in use` | Puerto ocupado por otro servicio | Cambiar puertos en `docker-compose.yml` o detener servicio |
| `relation "tc_devices" does not exist` | BD no inicializada | `docker compose exec -T timescaledb psql -U dmt_admin -d dmtracker < scripts/setup-timescaledb.sql` |
| `Cannot connect to Redis` | Redis no iniciado | `docker compose logs redis` |
| `502 Bad Gateway` en Nginx | Servicio upstream caído | `docker compose ps` y verificar estado |
| API no responde | Error en código Python | `docker compose logs api` |
| Ingestor devuelve "internal_error" | Error en BD o parser | `docker compose logs ingestor` |
| Dashboard no carga mapa | API no accesible | Verificar `VITE_API_URL` en frontend |
| `cannot load certificate` | SSL no configurado | Usar config HTTP (sin SSL) para desarrollo |
| npm ci falla en build | Falta package-lock.json | Cambiar a `npm install` en Dockerfile |

---

## Notas Finales

1. **No modificar Traccar Client** — El protocolo OsmAnd en puerto 5055 es compatible con las apps existentes en App Store y Google Play
2. **Backup antes de cambios grandes** — La carpeta `pgdata/` contiene toda la BD
3. **Usar `docker compose down -v` con cuidado** — Elimina volúmenes (datos BD, Redis)
4. **Documentar cualquier cambio** en este archivo o en el README.md
5. **Probar en staging antes de producción** — Usar `docker compose --profile dev` si se implementa

---

**Documento generado:** Junio 2026  
**Contacto:** D-MUJERES — Área de Sistemas  
**Próximo programador:** Asignado a Fase 6 (Estabilización)