-- ============================================================
-- Indices para optimizar consultas de 50 usuarios simultaneos
-- ============================================================

BEGIN;

-- 1. Indice compuesto para replay de rutas (device_id + server_time)
CREATE INDEX IF NOT EXISTS idx_positions_device_time
ON tc_positions (deviceid, servertime DESC);

-- 2. Indice para eventos (device_id + server_time)
CREATE INDEX IF NOT EXISTS idx_events_device_time
ON tc_events (deviceid, servertime DESC);

-- 3. Indice para consultas de bateria (text pattern)
-- attributes se almacena como VARCHAR(4000) con JSON interno
CREATE INDEX IF NOT EXISTS idx_positions_battery_level
ON tc_positions (deviceid, fixtime DESC)
WHERE attributes LIKE '%batteryLevel%';

-- 4. Estadisticas actualizadas
ANALYZE tc_positions;
ANALYZE tc_events;

-- Verificar indices creados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'tc_positions'
ORDER BY indexname;

COMMIT;
