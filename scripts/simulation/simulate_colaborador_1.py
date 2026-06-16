import asyncio
import os
import math
import urllib.request
import json
from datetime import datetime, timedelta
import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dmt_admin:dmt_prod_secure_2026_change_me@timescaledb:5432/dmtracker")
DEVICE_ID = 101 # Colaborador Simulado 1

# Coordinates
CUE_LAT, CUE_LON = -2.9001, -79.0059
GYE_LAT, GYE_LON = -2.1894, -79.8890

# Stop coordinates along the highway
stops_gye_cue = [
    (-2.1645, -79.8247), # Durán
    (-2.4282, -79.3392), # La Troncal
    (-2.5607, -78.9372), # Cañar
    (-2.7397, -78.8475)  # Azogues
]

stops_cue_gye = stops_gye_cue[::-1] # Azogues, Cañar, La Troncal, Durán

# Local Cuenca delivery spots
spots_cue = [
    (-2.9231, -79.0182), # Mall del Río
    (-2.9064, -79.0019), # Parque de la Madre
    (-2.9085, -78.9958)  # Supermaxi El Vergel
]

# Local Guayaquil delivery spots
spots_gye = [
    (-2.1554, -79.8924), # Mall del Sol
    (-2.1911, -79.8878), # Parque Centenario
    (-2.1951, -79.8789)  # Malecón 2000
]

def fetch_osrm_route(coords_list):
    coords_str = ";".join([f"{c[1]},{c[0]}" for c in coords_list])
    url = f"http://router.project-osrm.org/route/v1/driving/{coords_str}?overview=full&geometries=geojson"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            data = json.loads(response.read().decode('utf-8'))
            coords = data['routes'][0]['geometry']['coordinates']
            return [(c[1], c[0]) for c in coords]
    except Exception as e:
        print(f"⚠️ Warning: OSRM route fetch failed ({e}). Falling back to linear interpolation.")
        result = []
        for i in range(1, len(coords_list)):
            p1 = coords_list[i-1]
            p2 = coords_list[i]
            # Interpolate 100 points
            for step in range(100):
                f = step / 100.0
                result.append((p1[0] + f*(p2[0]-p1[0]), p1[1] + f*(p2[1]-p1[1])))
        result.append(coords_list[-1])
        return result

def get_distance(p1, p2):
    R = 6371.0
    lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
    lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin(dlon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-math.sqrt(a)))
    return R * c

def get_bearing(p1, p2):
    lat1, lon1 = math.radians(p1[0]), math.radians(p1[1])
    lat2, lon2 = math.radians(p2[0]), math.radians(p2[1])
    dlon = lon2 - lon1
    y = math.sin(dlon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    return math.degrees(math.atan2(y, x)) % 360

def build_route(coords):
    cum_dist = [0.0]
    total = 0.0
    for i in range(1, len(coords)):
        d = get_distance(coords[i-1], coords[i])
        total += d
        cum_dist.append(total)
    return cum_dist, total

def get_point_at_distance(coords, cum_dist, total, d_target):
    if d_target <= 0.0:
        return coords[0], get_bearing(coords[0], coords[1])
    if d_target >= total:
        return coords[-1], get_bearing(coords[-2], coords[-1])
        
    for i in range(1, len(cum_dist)):
        if cum_dist[i] >= d_target:
            d_prev = cum_dist[i-1]
            d_next = cum_dist[i]
            frac = (d_target - d_prev) / (d_next - d_prev) if d_next > d_prev else 0.0
            
            p_prev = coords[i-1]
            p_next = coords[i]
            
            lat = p_prev[0] + frac * (p_next[0] - p_prev[0])
            lon = p_prev[1] + frac * (p_next[1] - p_prev[1])
            bearing = get_bearing(p_prev, p_next)
            return (lat, lon), bearing
    return coords[-1], 0.0

def find_closest_index(coords, target_lat, target_lon):
    min_d = float('inf')
    min_idx = 0
    for idx, p in enumerate(coords):
        d = (p[0] - target_lat)**2 + (p[1] - target_lon)**2
        if d < min_d:
            min_d = d
            min_idx = idx
    return min_idx

def simulate_trip(coords, stop_locations, speed_kmh, start_time):
    cum_dist, total_dist = build_route(coords)
    
    # Target distances of our stops
    stop_distances = []
    for lat, lon in stop_locations:
        idx = find_closest_index(coords, lat, lon)
        stop_distances.append(cum_dist[idx])
    
    stop_distances.sort()
    
    current_dist = 0.0
    speed_min = speed_kmh / 60.0  # km per minute
    
    records = []
    stop_minutes_left = 0
    current_stop_idx = 0
    stop_loc = None
    
    for m in range(600):  # 10 hours workday = 600 minutes
        report_time = start_time + timedelta(minutes=m)
        
        if stop_minutes_left > 0:
            stop_minutes_left -= 1
            # Add stopped point (speed = 0)
            records.append((
                'osmand', DEVICE_ID, report_time, report_time, report_time, True,
                stop_loc[0], stop_loc[1], 100.0, 0.0, 0.0, None,
                '{"batteryLevel":95,"status":"stopped"}', 10.0, None, None
            ))
            continue
            
        # Check if we should start a stop
        if current_stop_idx < len(stop_distances):
            next_stop_d = stop_distances[current_stop_idx]
            if current_dist < next_stop_d and current_dist + speed_min >= next_stop_d:
                current_dist = next_stop_d
                stop_loc, _ = get_point_at_distance(coords, cum_dist, total_dist, current_dist)
                stop_minutes_left = 29  # 30 minutes total (1 now + 29 in loop)
                current_stop_idx += 1
                records.append((
                    'osmand', DEVICE_ID, report_time, report_time, report_time, True,
                    stop_loc[0], stop_loc[1], 100.0, 0.0, 0.0, None,
                    '{"batteryLevel":95,"status":"stopped"}', 10.0, None, None
                ))
                continue
                
        # If we have reached the end of the route
        if current_dist >= total_dist:
            dest_loc = coords[-1]
            records.append((
                'osmand', DEVICE_ID, report_time, report_time, report_time, True,
                dest_loc[0], dest_loc[1], 100.0, 0.0, 0.0, None,
                '{"batteryLevel":95,"status":"stopped"}', 10.0, None, None
            ))
            continue
            
        # Drive
        current_dist += speed_min
        if current_dist >= total_dist:
            current_dist = total_dist
            
        pos, bearing = get_point_at_distance(coords, cum_dist, total_dist, current_dist)
        speed_knots = speed_kmh * 0.539957
        records.append((
            'osmand', DEVICE_ID, report_time, report_time, report_time, True,
            pos[0], pos[1], 100.0, speed_knots, bearing, None,
            '{"batteryLevel":95,"status":"moving"}', 10.0, None, None
        ))
        
    return records

async def main():
    print("Connecting to TimescaleDB...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected successfully.")
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return

    # 1. Fetch paths from OSRM
    print("Fetching highway routes from OSRM...")
    gye_cue_coords = fetch_osrm_route([(GYE_LAT, GYE_LON), (CUE_LAT, CUE_LON)])
    cue_gye_coords = fetch_osrm_route([(CUE_LAT, CUE_LON), (GYE_LAT, GYE_LON)])
    
    print("Fetching local routes from OSRM...")
    local_cue_coords = fetch_osrm_route([(CUE_LAT, CUE_LON)] + spots_cue + [(CUE_LAT, CUE_LON)])
    local_gye_coords = fetch_osrm_route([(GYE_LAT, GYE_LON)] + spots_gye + [(GYE_LAT, GYE_LON)])
    
    print(f"GYE->CUE coordinates: {len(gye_cue_coords)}, CUE->GYE coordinates: {len(cue_gye_coords)}")
    print(f"Local CUE coordinates: {len(local_cue_coords)}, Local GYE coordinates: {len(local_gye_coords)}")

    # 2. Setup dates
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    print(f"Simulating 1 month of structured data: {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}...")

    # 3. Clear existing positions for device 101
    print(f"Clearing historical positions for device {DEVICE_ID}...")
    await conn.execute("DELETE FROM tc_positions WHERE deviceid = $1", DEVICE_ID)

    # 4. Generate records day-by-day
    all_records = []
    for day_idx in range(30):
        current_day = start_date + timedelta(days=day_idx)
        cycle_day = day_idx % 4
        
        # Determine day type and simulate
        if cycle_day == 0:
            # Day 1: GYE -> CUE (Highway, stops for 30m in Durán, La Troncal, Cañar, Azogues)
            start_time = datetime(current_day.year, current_day.month, current_day.day, 13, 0, 0) # 08:00 AM local
            day_records = simulate_trip(gye_cue_coords, stops_gye_cue, 75.0, start_time)
            print(f"  Day {day_idx+1}/30: {current_day.strftime('%Y-%m-%d')} - Guayaquil -> Cuenca (with stops) [Points: {len(day_records)}]")
        elif cycle_day == 1:
            # Day 2: Local Cuenca (Stops at Mall del Río, Parque de la Madre, Supermaxi)
            start_time = datetime(current_day.year, current_day.month, current_day.day, 14, 0, 0) # 09:00 AM local
            day_records = simulate_trip(local_cue_coords, spots_cue, 35.0, start_time)
            print(f"  Day {day_idx+1}/30: {current_day.strftime('%Y-%m-%d')} - Local Cuenca (deliveries) [Points: {len(day_records)}]")
        elif cycle_day == 2:
            # Day 3: CUE -> GYE (Highway, stops for 30m in Azogues, Cañar, La Troncal, Durán)
            start_time = datetime(current_day.year, current_day.month, current_day.day, 13, 0, 0) # 08:00 AM local
            day_records = simulate_trip(cue_gye_coords, stops_cue_gye, 75.0, start_time)
            print(f"  Day {day_idx+1}/30: {current_day.strftime('%Y-%m-%d')} - Cuenca -> Guayaquil (with stops) [Points: {len(day_records)}]")
        else:
            # Day 4: Local Guayaquil (Stops at Mall del Sol, Parque Centenario, Malecón 2000)
            start_time = datetime(current_day.year, current_day.month, current_day.day, 14, 0, 0) # 09:00 AM local
            day_records = simulate_trip(local_gye_coords, spots_gye, 35.0, start_time)
            print(f"  Day {day_idx+1}/30: {current_day.strftime('%Y-%m-%d')} - Local Guayaquil (deliveries) [Points: {len(day_records)}]")
            
        all_records.extend(day_records)

    # 5. Insert records into TimescaleDB using fast binary copy
    print(f"Inserting {len(all_records)} positions into tc_positions...")
    await conn.copy_records_to_table(
        'tc_positions',
        records=all_records,
        columns=[
            'protocol', 'deviceid', 'servertime', 'devicetime', 'fixtime',
            'valid', 'latitude', 'longitude', 'altitude', 'speed', 'course',
            'address', 'attributes', 'accuracy', 'network', 'geofenceids'
        ]
    )
    print("✅ Insert complete.")

    # 6. Update latest position in tc_devices
    print("Linking device 101 to its last position...")
    last_pos = await conn.fetchrow("SELECT id FROM tc_positions WHERE deviceid = $1 ORDER BY fixtime DESC LIMIT 1", DEVICE_ID)
    if last_pos:
        await conn.execute("UPDATE tc_devices SET positionid = $1, lastupdate = NOW() WHERE id = $2", last_pos['id'], DEVICE_ID)
    print("✅ Latest position linked.")

    await conn.close()
    print("🚀 Colaborador Simulado 1 high-fidelity route generation completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
