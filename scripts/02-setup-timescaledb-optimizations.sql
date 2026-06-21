-- Create PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis CASCADE;

-- Convert tc_positions to hypertable
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM _timescaledb_catalog.hypertable WHERE table_name = 'tc_positions') THEN
        ALTER TABLE tc_positions DROP CONSTRAINT tc_positions_pkey CASCADE;
        ALTER TABLE tc_positions ADD PRIMARY KEY (id, servertime);
        PERFORM create_hypertable('tc_positions', 'servertime', chunk_time_interval => INTERVAL '7 days');
        ALTER TABLE tc_positions SET (
            timescaledb.compress,
            timescaledb.compress_segmentby = 'deviceid',
            timescaledb.compress_orderby = 'servertime DESC'
        );
        PERFORM add_compression_policy('tc_positions', INTERVAL '7 days');
        CREATE INDEX IF NOT EXISTS idx_tc_positions_device_servertime ON tc_positions (deviceid, servertime DESC);
    END IF;
END $$;

-- Convert tc_events to hypertable
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM _timescaledb_catalog.hypertable WHERE table_name = 'tc_events') THEN
        ALTER TABLE tc_events DROP CONSTRAINT tc_events_pkey CASCADE;
        ALTER TABLE tc_events ADD PRIMARY KEY (id, eventtime);
        PERFORM create_hypertable('tc_events', 'eventtime', chunk_time_interval => INTERVAL '30 days');
    END IF;
END $$;

-- Retention: delete raw positions older than 1 year
SELECT add_retention_policy('tc_positions', INTERVAL '365 days', if_not_exists => true);

-- Hourly summary table for infinite history
CREATE TABLE IF NOT EXISTS position_hourly_summary (
    deviceid INTEGER NOT NULL,
    hour_start TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    avg_latitude DOUBLE PRECISION,
    avg_longitude DOUBLE PRECISION,
    max_speed DOUBLE PRECISION,
    avg_speed DOUBLE PRECISION,
    total_distance DOUBLE PRECISION,
    points_count INTEGER,
    moving_time_minutes INTEGER,
    PRIMARY KEY (deviceid, hour_start)
);

SELECT create_hypertable('position_hourly_summary', 'hour_start', if_not_exists => TRUE,
    chunk_time_interval => INTERVAL '30 days');

-- Materialized view for last position per device
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_last_positions AS
SELECT DISTINCT ON (p.deviceid)
    p.id,
    p.deviceid,
    p.servertime,
    p.latitude,
    p.longitude,
    p.speed,
    p.course,
    p.altitude,
    p.valid,
    p.attributes,
    p.address,
    ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326)::geometry(Point, 4326) AS geom
FROM tc_positions p
ORDER BY p.deviceid, p.servertime DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_last_positions_device ON mv_last_positions (deviceid);

-- Function to refresh MV
CREATE OR REPLACE FUNCTION refresh_last_positions()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_last_positions;
END;
$$ LANGUAGE plpgsql;
