import asyncio
import os
import math
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta
import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dmt_admin:dmt_prod_secure_2026_change_me@localhost:5432/dmtracker")
DEVICE_ID = 102  # Colaborador Simulado 2
KML_PATH = os.getenv("KML_PATH", "/home/Dmujeres-traccar/data-test/positions.kml")

def parse_kml_points(file_path):
    print(f"Reading KML file: {file_path}")
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Find all <coordinates> blocks
    coords_blocks = re.findall(r'<coordinates>(.*?)</coordinates>', content, re.DOTALL)
    points = []
    for block in coords_blocks:
        # split by whitespace
        for token in re.split(r'\s+', block.strip()):
            if not token:
                continue
            parts = token.split(',')
            if len(parts) >= 2:
                try:
                    lon = float(parts[0])
                    lat = float(parts[1])
                    points.append((lat, lon))
                except ValueError:
                    continue
    return points

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

async def main():
    # 1. Parse KML
    points = parse_kml_points(KML_PATH)
    if not points:
        print("❌ No coordinates found in KML file.")
        return
    
    total_raw = len(points)
    print(f"✅ Extracted {total_raw} raw coordinates.")

    # 2. Downsample coordinates to prevent database and map saturation
    # We now load all 4830 points as requested by the user.
    downsample_factor = 1
    sampled_points = points[::downsample_factor]
    if sampled_points[-1] != points[-1]:
        sampled_points.append(points[-1])
    
    total_points = len(sampled_points)
    print(f"✅ Loaded {total_points} coordinates (factor 1/{downsample_factor}).")

    # 3. Setup times
    # Target date: June 12th, 2026.
    # Driving window: 08:00 AM local (13:00 UTC) to 06:00 PM local (23:00 UTC)
    # Total duration = 10 hours = 600 minutes = 36000 seconds
    start_time = datetime(2026, 6, 12, 13, 0, 0) # UTC
    total_duration_sec = 10 * 3600
    time_step_sec = total_duration_sec / (total_points - 1) if total_points > 1 else 0

    print(f"Time window: {start_time} UTC to {start_time + timedelta(seconds=total_duration_sec)} UTC")
    print(f"Calculated time step between points: {time_step_sec:.2f} seconds")

    # 4. Generate positions
    records = []
    for i in range(total_points):
        curr_point = sampled_points[i]
        report_time = start_time + timedelta(seconds=i * time_step_sec)
        
        # Calculate speed and bearing from previous point
        if i > 0:
            prev_point = sampled_points[i-1]
            dist_km = get_distance(prev_point, curr_point)
            bearing = get_bearing(prev_point, curr_point)
            
            # Speed = dist / time
            # time_step_sec in hours = time_step_sec / 3600
            time_hours = time_step_sec / 3600.0
            speed_kmh = dist_km / time_hours if time_hours > 0 else 0.0
            
            # Cap speed to prevent GPS jump anomalies
            if speed_kmh > 90.0:
                speed_kmh = 80.0
            elif speed_kmh < 5.0:
                # If moving extremely slowly, consider it stopped
                speed_kmh = 0.0
        else:
            bearing = 0.0
            speed_kmh = 0.0
            
        # Convert speed to knots for Traccar
        speed_knots = speed_kmh * 0.539957
        
        status = "moving" if speed_kmh > 0 else "stopped"
        attributes = f'{{"batteryLevel":92,"status":"{status}","ignition":{str(speed_kmh > 0).lower()}}}'
        
        records.append((
            'osmand', DEVICE_ID, report_time, report_time, report_time, True,
            curr_point[0], curr_point[1], 100.0, speed_knots, bearing, None,
            attributes, 10.0, None, None
        ))

    # 5. Connect to database and insert
    print("Connecting to database...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected to database.")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return

    print(f"Clearing historical positions for device {DEVICE_ID}...")
    await conn.execute("DELETE FROM tc_positions WHERE deviceid = $1", DEVICE_ID)

    print(f"Inserting {len(records)} positions into tc_positions...")
    await conn.copy_records_to_table(
        'tc_positions',
        records=records,
        columns=[
            'protocol', 'deviceid', 'servertime', 'devicetime', 'fixtime',
            'valid', 'latitude', 'longitude', 'altitude', 'speed', 'course',
            'address', 'attributes', 'accuracy', 'network', 'geofenceids'
        ]
    )
    print("✅ Positions inserted successfully.")

    # 6. Link latest position in tc_devices
    print(f"Linking last position for device {DEVICE_ID} in tc_devices...")
    last_pos = await conn.fetchrow("SELECT id FROM tc_positions WHERE deviceid = $1 ORDER BY fixtime DESC LIMIT 1", DEVICE_ID)
    if last_pos:
        await conn.execute("UPDATE tc_devices SET positionid = $1, lastupdate = NOW() WHERE id = $2", last_pos['id'], DEVICE_ID)
    print("✅ Latest position linked.")

    await conn.close()
    print(f"🚀 Simulation completed successfully for Colaborador Simulado 2 on 2026-06-12!")

if __name__ == "__main__":
    asyncio.run(main())
