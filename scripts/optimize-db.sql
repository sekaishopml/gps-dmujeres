-- ============================================
-- D-MUJERES TRACCAR - Database Optimization
-- Materialized Views + Summary Tables
-- ============================================

BEGIN;

-- 1. Materialized View: Last position per device (fast device status)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_last_positions AS
SELECT DISTINCT ON (p.deviceid)
  p.id,
  p.deviceid,
  d.name AS device_name,
  d.uniqueid,
  p.latitude,
  p.longitude,
  p.servertime,
  p.devicetime,
  p.speed,
  p.course,
  p.altitude,
  p.accuracy,
  p.attributes,
  ST_SetSRID(ST_MakePoint(p.longitude, p.latitude), 4326) AS geom
FROM tc_positions p
JOIN tc_devices d ON d.id = p.deviceid
WHERE p.valid = true
ORDER BY p.deviceid, p.servertime DESC;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_last_pos_deviceid ON mv_last_positions (deviceid);

-- 2. Materialized View: Daily route summary per device
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_daily_routes AS
SELECT
  deviceid,
  date_trunc('day', servertime) AS day,
  count(*) AS point_count,
  min(servertime) AS first_time,
  max(servertime) AS last_time,
  min(latitude) AS min_lat,
  max(latitude) AS max_lat,
  min(longitude) AS min_lng,
  max(longitude) AS max_lng,
  avg(speed)::numeric(6,2) AS avg_speed,
  max(speed)::numeric(6,2) AS max_speed,
  count(*) FILTER (WHERE speed = 0) AS stops,
  avg(accuracy)::numeric(6,2) AS avg_accuracy
FROM tc_positions
WHERE valid = true
GROUP BY deviceid, date_trunc('day', servertime);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_daily_routes_device_day ON mv_daily_routes (deviceid, day);

-- 3. Summary table: positions by hour (for fast historical aggregation)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hourly_stats AS
SELECT
  deviceid,
  date_trunc('hour', servertime) AS hour,
  count(*) AS point_count,
  count(*) FILTER (WHERE speed > 0) AS moving_points,
  avg(speed)::numeric(6,2) AS avg_speed,
  max(speed)::numeric(6,2) AS max_speed,
  min(speed)::numeric(6,2) AS min_speed,
  min(latitude) AS min_lat,
  max(latitude) AS max_lat,
  min(longitude) AS min_lng,
  max(longitude) AS max_lng,
  avg(accuracy)::numeric(6,2) AS avg_accuracy
FROM tc_positions
WHERE valid = true
GROUP BY deviceid, date_trunc('hour', servertime);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_hourly_stats_device_hour ON mv_hourly_stats (deviceid, hour);

-- 4. Index: compound index for common route queries (already exists but verify)
-- idx_tc_positions_device_time already covers (deviceid, servertime DESC)

-- 5. Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_last_positions;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_routes;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hourly_stats;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- Verify views after creation
SELECT schemaname, matviewname, matviewowner, ispopulated
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY matviewname;
