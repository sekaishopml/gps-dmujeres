-- ============================================
-- D-MUJERES-TRACCAR: Inicialización TimescaleDB
-- ============================================

-- Habilitar extensión TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

-- Habilitar PostGIS para consultas geoespaciales
CREATE EXTENSION IF NOT EXISTS postgis CASCADE;

-- ============================================
-- Tabla Principal: Posiciones GPS
-- ============================================
CREATE TABLE IF NOT EXISTS tc_positions (
    id            BIGSERIAL,
    time          TIMESTAMPTZ NOT NULL,
    device_id     INTEGER NOT NULL,
    latitude      DOUBLE PRECISION NOT NULL,
    longitude     DOUBLE PRECISION NOT NULL,
    altitude      DOUBLE PRECISION DEFAULT 0,
    speed         DOUBLE PRECISION DEFAULT 0,       -- km/h
    course        DOUBLE PRECISION DEFAULT 0,       -- grados
    accuracy      DOUBLE PRECISION DEFAULT 0,       -- metros
    attributes    JSONB DEFAULT '{}',
    geog          GEOGRAPHY(POINT, 4326),
    created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Hypertable: Particionado automático por tiempo
-- ============================================
-- Chunks de 7 días: balance óptimo entre granularidad y rendimiento
SELECT create_hypertable('tc_positions', 'time',
    chunk_time_interval => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Habilitar compresión a los 7 días (ahorra ~90% espacio)
ALTER TABLE tc_positions SET (
    timescaledb.compress,
    timescaledb.compress_segmentby = 'device_id',
    timescaledb.compress_orderby = 'time DESC'
);

-- Política de compresión automática
SELECT add_compression_policy('tc_positions',
    compress_after => INTERVAL '7 days',
    if_not_exists => TRUE
);

-- Política de retención: eliminar datos de más de 2 años
SELECT add_retention_policy('tc_positions',
    drop_after => INTERVAL '2 years',
    if_not_exists => TRUE
);

-- ============================================
-- Índices optimizados para consultas históricas
-- ============================================

-- Consulta principal: posiciones de un dispositivo en rango de fechas
CREATE INDEX IF NOT EXISTS idx_positions_device_time
    ON tc_positions (device_id, time DESC);

-- Búsqueda por atributos JSONB (batería, carga, etc.)
CREATE INDEX IF NOT EXISTS idx_positions_attributes
    ON tc_positions USING GIN (attributes jsonb_path_ops);

-- Índice geoespacial para consultas de proximidad
CREATE INDEX IF NOT EXISTS idx_positions_geog
    ON tc_positions USING GIST (geog);

-- Índice parcial para consultas de último mes (los datos más frecuentes)
CREATE INDEX IF NOT EXISTS idx_positions_device_recent
    ON tc_positions (device_id, time DESC)
    WHERE time > NOW() - INTERVAL '30 days';

-- ============================================
-- Tabla de Dispositivos (metadatos)
-- ============================================
CREATE TABLE IF NOT EXISTS tc_devices (
    id              SERIAL PRIMARY KEY,
    device_uid      VARCHAR(64) UNIQUE NOT NULL,   -- ID que envía Traccar Client
    name            VARCHAR(128) NOT NULL DEFAULT '',
    plate           VARCHAR(20) DEFAULT '',         -- Placa del vehículo
    driver_name     VARCHAR(128) DEFAULT '',
    phone           VARCHAR(32) DEFAULT '',
    group_id        INTEGER DEFAULT 0,
    status          VARCHAR(16) DEFAULT 'active',
    last_position   TIMESTAMPTZ,
    last_latitude   DOUBLE PRECISION,
    last_longitude  DOUBLE PRECISION,
    attributes      JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsqueda rápida por device_uid
CREATE INDEX IF NOT EXISTS idx_devices_uid ON tc_devices (device_uid);

-- ============================================
-- Tabla de Eventos (paradas, excesos de velocidad, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS tc_events (
    id          BIGSERIAL,
    time        TIMESTAMPTZ NOT NULL,
    device_id   INTEGER NOT NULL,
    type        VARCHAR(32) NOT NULL,     -- 'stop', 'speeding', 'ignition_off', etc.
    latitude    DOUBLE PRECISION,
    longitude   DOUBLE PRECISION,
    duration    INTEGER DEFAULT 0,        -- segundos, útil para paradas
    attributes  JSONB DEFAULT '{}',
    geog        GEOGRAPHY(POINT, 4326)
);

SELECT create_hypertable('tc_events', 'time',
    chunk_time_interval => INTERVAL '30 days',
    if_not_exists => TRUE
);

CREATE INDEX IF NOT EXISTS idx_events_device_time
    ON tc_events (device_id, time DESC);

-- ============================================
-- Función: Actualizar last_position en tc_devices
-- ============================================
CREATE OR REPLACE FUNCTION update_device_last_position()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE tc_devices
    SET last_position = NEW.time,
        last_latitude = NEW.latitude,
        last_longitude = NEW.longitude,
        updated_at = NOW()
    WHERE device_uid = NEW.device_id::text;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta después de cada INSERT
DROP TRIGGER IF EXISTS trg_update_last_position ON tc_positions;
CREATE TRIGGER trg_update_last_position
    AFTER INSERT ON tc_positions
    FOR EACH ROW
    EXECUTE FUNCTION update_device_last_position();

-- ============================================
-- Insertar dispositivo de prueba
-- ============================================
INSERT INTO tc_devices (device_uid, name, plate, driver_name)
VALUES ('123456', 'Vehículo Demo', 'ABC-0001', 'Conductor Demo')
ON CONFLICT (device_uid) DO NOTHING;

-- ============================================
-- Resumen Final
-- ============================================
-- La base de datos dmtracker está lista con:
--   - Hypertable tc_positions (chunks de 7 días)
--   - Compresión automática a los 7 días
--   - Retención de 2 años
--   - PostGIS para consultas geoespaciales
--   - Índices optimizados para consultas históricas