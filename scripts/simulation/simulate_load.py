import asyncio
import os
import random
import math
from datetime import datetime, timedelta
import asyncpg

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://dmt_admin:dmt_prod_secure_2026_change_me@localhost:5432/dmtracker")

# Cities in Ecuador for route simulation
CITIES = {
    "Guayaquil": {"lat": -2.1894, "lon": -79.8890, "range": 0.05, "devices": range(1, 51)},
    "Quito": {"lat": -0.1807, "lon": -78.4678, "range": 0.05, "devices": range(51, 81)},
    "Cuenca": {"lat": -2.9001, "lon": -79.0059, "range": 0.03, "devices": range(81, 101)},
}

async def main():
    print("Connecting to TimescaleDB...")
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        print("✅ Connected successfully.")
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return

    # 1. Clean existing test data to ensure clean runs
    print("Checking for existing simulated devices...")
    sim_devices = await conn.fetch("SELECT id FROM tc_devices WHERE uniqueid LIKE 'sim_%'")
    sim_ids = [d['id'] for d in sim_devices]
    if sim_ids:
        print(f"Found {len(sim_ids)} legacy simulated devices. Cleaning up historical data...")
        await conn.execute("DELETE FROM tc_positions WHERE deviceid = ANY($1)", sim_ids)
        await conn.execute("DELETE FROM tc_user_device WHERE deviceid = ANY($1)", sim_ids)
        await conn.execute("DELETE FROM tc_devices WHERE id = ANY($1)", sim_ids)
        print("✅ Cleanup complete.")

    # 2. Insert 100 new simulated collaborators
    print("Registering 100 simulated collaborators in tc_devices...")
    device_insert_data = []
    for i in range(1, 101):
        name = f"Colaborador Simulado {i}"
        uniqueid = f"sim_{i:03d}"
        phone = f"+593987654{i:03d}"
        device_insert_data.append((name, uniqueid, phone, 'person', 'offline'))
        
    await conn.executemany(
        "INSERT INTO tc_devices (name, uniqueid, phone, category, status) VALUES ($1, $2, $3, $4, $5)",
        device_insert_data
    )
    
    # Retrieve the generated IDs
    sim_devices = await conn.fetch("SELECT id, name, uniqueid FROM tc_devices WHERE uniqueid LIKE 'sim_%' ORDER BY id")
    print(f"✅ Registered {len(sim_devices)} devices.")
    
    # Link devices to admin user (ID 1)
    print("Linking devices to admin user (ID 1)...")
    user_device_data = [(1, d['id']) for d in sim_devices]
    await conn.executemany(
        "INSERT INTO tc_user_device (userid, deviceid) VALUES ($1, $2)",
        user_device_data
    )
    print("✅ Devices linked.")
    
    # 3. Generate positions for 30 days
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=30)
    
    print(f"Generating routes from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}...")
    
    # Map devices to their respective cities
    device_city_map = {}
    for city, info in CITIES.items():
        for idx in info["devices"]:
            device_city_map[f"sim_{idx:03d}"] = city

    R = 6371.0  # Earth's radius in km
    records = []
    batch_size = 100000
    total_inserted = 0

    # Let's loop over each day and each device
    # This keeps memory consumption bounded
    current_day = start_date
    while current_day <= end_date:
        print(f"Generating day {current_day.strftime('%Y-%m-%d')}...")
        for device in sim_devices:
            dev_id = device['id']
            uniq_id = device['uniqueid']
            city = device_city_map[uniq_id]
            city_info = CITIES[city]
            
            # Start of workday: 08:00 AM local time -> 13:00 UTC
            start_work = datetime(current_day.year, current_day.month, current_day.day, 13, 0, 0)
            
            # Initial position for the day (close to city center)
            lat = city_info["lat"] + random.uniform(-0.01, 0.01)
            lon = city_info["lon"] + random.uniform(-0.01, 0.01)
            
            is_stopped = False
            stop_remaining = 0
            speed = 0.0
            course = random.uniform(0, 360)
            
            # Generate 1 report every minute for 10 hours (600 minutes)
            for m in range(600):
                report_time = start_work + timedelta(minutes=m)
                
                if is_stopped:
                    stop_remaining -= 1
                    speed = 0.0
                    if stop_remaining <= 0:
                        is_stopped = False
                else:
                    # 2% chance of stopping at any minute
                    if random.random() < 0.02:
                        is_stopped = True
                        stop_remaining = random.choice([5, 10, 15, 30, 45])
                        speed = 0.0
                    else:
                        # Random speed between 15 and 60 km/h
                        speed = random.uniform(15.0, 60.0)
                        # Slightly drift course
                        course = (course + random.uniform(-25, 25)) % 360
                        
                        # Distance traveled in 1 minute
                        dist = speed / 60.0  # km
                        
                        # Calculate offsets
                        lat_offset = (dist / R) * (180.0 / math.pi) * math.cos(math.radians(course))
                        lon_offset = (dist / R) * (180.0 / math.pi) * math.sin(math.radians(course)) / math.cos(math.radians(lat))
                        
                        lat += lat_offset
                        lon += lon_offset
                        
                        # Geofence boundary check: keep within ~12 km of city center
                        dist_to_center = math.sqrt((lat - city_info["lat"])**2 + (lon - city_info["lon"])**2)
                        if dist_to_center > 0.1:  # approx 11km
                            # Force course back towards center
                            dx = city_info["lon"] - lon
                            dy = city_info["lat"] - lat
                            course = math.degrees(math.atan2(dx, dy)) % 360

                # Speed in knots (Traccar standard)
                speed_knots = speed * 0.539957
                
                # Append position record
                # Columns order: protocol, deviceid, servertime, devicetime, fixtime, valid, latitude, longitude, altitude, speed, course, address, attributes, accuracy, network, geofenceids
                records.append((
                    'osmand',
                    dev_id,
                    report_time,
                    report_time,
                    report_time,
                    True,
                    lat,
                    lon,
                    15.0,
                    speed_knots,
                    course,
                    None,
                    '{"batteryLevel":95,"status":"moving"}' if speed > 0 else '{"batteryLevel":95,"status":"stopped"}',
                    10.0,
                    None,
                    None
                ))

                # Flush to db if batch limit reached
                if len(records) >= batch_size:
                    await conn.copy_records_to_table(
                        'tc_positions',
                        records=records,
                        columns=[
                            'protocol', 'deviceid', 'servertime', 'devicetime', 'fixtime',
                            'valid', 'latitude', 'longitude', 'altitude', 'speed', 'course',
                            'address', 'attributes', 'accuracy', 'network', 'geofenceids'
                        ]
                    )
                    total_inserted += len(records)
                    print(f"Inserted {total_inserted} records...")
                    records = []
                    
        current_day += timedelta(days=1)

    # Insert remaining records
    if records:
        await conn.copy_records_to_table(
            'tc_positions',
            records=records,
            columns=[
                'protocol', 'deviceid', 'servertime', 'devicetime', 'fixtime',
                'valid', 'latitude', 'longitude', 'altitude', 'speed', 'course',
                'address', 'attributes', 'accuracy', 'network', 'geofenceids'
            ]
        )
        total_inserted += len(records)
        print(f"Inserted final batch. Total inserted: {total_inserted} records.")

    # 4. Update latest positions in tc_devices (Traccar expects last position link)
    print("Linking devices to their last position...")
    for device in sim_devices:
        dev_id = device['id']
        # Get max position ID for this device
        last_pos = await conn.fetchrow("SELECT id FROM tc_positions WHERE deviceid = $1 ORDER BY fixtime DESC LIMIT 1", dev_id)
        if last_pos:
            await conn.execute("UPDATE tc_devices SET positionid = $1, lastupdate = NOW() WHERE id = $2", last_pos['id'], dev_id)
    print("✅ Device links updated.")
    
    await conn.close()
    print("🚀 Load simulation completed successfully!")

if __name__ == "__main__":
    asyncio.run(main())
