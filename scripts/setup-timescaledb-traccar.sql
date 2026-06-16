-- Habilitar extensión TimescaleDB y PostGIS
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS postgis CASCADE;

-- Procedimiento para convertir las tablas en hypertables después de que Liquibase las cree
CREATE OR REPLACE FUNCTION convert_to_hypertables() RETURNS void AS $$
BEGIN
    -- 1. Optimizar tc_positions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tc_positions') THEN
        -- Validar si ya es hypertable
        IF NOT EXISTS (SELECT 1 FROM _timescaledb_catalog.hypertable WHERE table_name = 'tc_positions') THEN
            -- Eliminar llave primaria de ID plano ya que TimescaleDB requiere que la columna de tiempo sea parte de la PK
            ALTER TABLE tc_positions DROP CONSTRAINT IF EXISTS pk_tc_positions;
            ALTER TABLE tc_positions ADD CONSTRAINT pk_tc_positions PRIMARY KEY (id, time);

            -- Crear hypertable por chunks de 7 días
            PERFORM create_hypertable('tc_positions', 'time', chunk_time_interval => INTERVAL '7 days');

            -- Habilitar compresión automática
            ALTER TABLE tc_positions SET (
                timescaledb.compress,
                timescaledb.compress_segmentby = 'deviceid',
                timescaledb.compress_orderby = 'time DESC'
            );
            PERFORM add_compression_policy('tc_positions', INTERVAL '7 days');

            -- Índices compuestos para consultas rápidas de reportes
            CREATE INDEX IF NOT EXISTS idx_positions_device_time ON tc_positions (deviceid, time DESC);
        END IF;
    END IF;

    -- 2. Optimizar tc_events
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tc_events') THEN
        IF NOT EXISTS (SELECT 1 FROM _timescaledb_catalog.hypertable WHERE table_name = 'tc_events') THEN
            ALTER TABLE tc_events DROP CONSTRAINT IF EXISTS pk_tc_events;
            ALTER TABLE tc_events ADD CONSTRAINT pk_tc_events PRIMARY KEY (id, eventtime);

            PERFORM create_hypertable('tc_events', 'eventtime', chunk_time_interval => INTERVAL '30 days');
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Trigger: Categoría por defecto (Persona)
-- ============================================
CREATE OR REPLACE FUNCTION set_default_device_category()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.category IS NULL OR NEW.category = '' THEN
        NEW.category := 'person';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_default_device_category ON tc_devices;
CREATE TRIGGER trg_set_default_device_category
    BEFORE INSERT ON tc_devices
    FOR EACH ROW
    EXECUTE FUNCTION set_default_device_category();

