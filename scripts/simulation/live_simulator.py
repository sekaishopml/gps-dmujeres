import time
import random
import math
import json
import urllib.request
import urllib.parse
import threading
from concurrent.futures import ThreadPoolExecutor

# TRACCAR OsmAnd Ingest Port inside the docker network
INGEST_URL = "http://localhost:5055/"

CITIES = {
    "Guayaquil": {
        "lat": -2.1894,
        "lon": -79.8890,
        "range": 0.05,
        "devices": range(1, 51)
    },
    "Quito": {
        "lat": -0.1807,
        "lon": -78.4678,
        "range": 0.05,
        "devices": range(51, 81)
    },
    "Cuenca": {
        "lat": -2.9001,
        "lon": -79.0059,
        "range": 0.03,
        "devices": range(81, 101)
    },
}

# Earth radius in meters
R_EARTH = 6371000.0

# Stats counters
pings_success = 0
pings_failed = 0
stats_lock = threading.Lock()

def haversine(lat1, lon1, lat2, lon2):
    """Calcula la distancia en metros entre dos coordenadas."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    a = math.sin(delta_phi / 2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R_EARTH * c

def calculate_bearing(lat1, lon1, lat2, lon2):
    """Calcula el rumbo/dirección en grados de un punto a otro."""
    d_lon = math.radians(lon2 - lon1)
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    y = math.sin(d_lon) * math.cos(lat2_rad)
    x = math.cos(lat1_rad) * math.sin(lat2_rad) - math.sin(lat1_rad) * math.cos(lat2_rad) * math.cos(d_lon)
    bearing = math.atan2(y, x)
    return (math.degrees(bearing) + 360) % 360

def fetch_osrm_route(start_lat, start_lon, end_lat, end_lon):
    """Obtiene una ruta real por carreteras desde la API pública de OSRM."""
    url = f"http://router.project-osrm.org/route/v1/driving/{start_lon:.6f},{start_lat:.6f};{end_lon:.6f},{end_lat:.6f}?overview=full&geometries=geojson"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'D-Mujeres-Simulator/1.0'})
        with urllib.request.urlopen(req, timeout=4) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                if data.get("code") == "Ok" and data.get("routes"):
                    geojson = data["routes"][0]["geometry"]
                    coords = geojson["coordinates"]
                    return [(pt[1], pt[0]) for pt in coords]
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] OSRM API Error: {e}. Fallback to line.")
    return None

def get_fallback_route(start_lat, start_lon, end_lat, end_lon):
    """Genera una ruta recta interpolada si falla la API de OSRM."""
    pts = []
    steps = 15
    for i in range(steps + 1):
        t = i / float(steps)
        lat = start_lat + t * (end_lat - start_lat)
        lon = start_lon + t * (end_lon - start_lon)
        pts.append((lat, lon))
    return pts

class SimulatedDevice:
    def __init__(self, index, city_name, center_lat, center_lon, city_range):
        self.index = index
        self.uniqueid = f"sim_{index:03d}"
        self.city_name = city_name
        self.center_lat = center_lat
        self.center_lon = center_lon
        self.city_range = city_range
        
        # Posición inicial
        self.lat = center_lat + random.uniform(-0.005, 0.005)
        self.lon = center_lon + random.uniform(-0.005, 0.005)
        
        self.route = []
        self.current_route_index = 0
        self.segment_progress = 0.0
        
        self.course = random.uniform(0, 360)
        self.speed = 0.0  # km/h
        
        # Comportamiento de parada
        self.is_stopped = False
        self.stop_remaining_ticks = 0
        
        # Estado de carga en segundo plano de nueva ruta
        self.next_route = None
        self.fetching_next_route = False

    def update_route_if_needed(self, route_executor):
        """Dispara la descarga en segundo plano de la siguiente ruta si es necesario."""
        if not self.route or (len(self.route) - self.current_route_index < 4):
            if not self.fetching_next_route and not self.next_route:
                self.fetching_next_route = True
                route_executor.submit(self._fetch_next_route_bg)

    def _fetch_next_route_bg(self):
        """Hilo de segundo plano para obtener la ruta de OSRM."""
        try:
            # Elegir destino aleatorio dentro del rango de la ciudad
            dest_lat = self.center_lat + random.uniform(-self.city_range, self.city_range)
            dest_lon = self.center_lon + random.uniform(-self.city_range, self.city_range)
            
            start_lat = self.lat
            start_lon = self.lon
            
            route = fetch_osrm_route(start_lat, start_lon, dest_lat, dest_lon)
            if not route:
                route = get_fallback_route(start_lat, start_lon, dest_lat, dest_lon)
                
            self.next_route = route
        except Exception as e:
            print(f"Error in bg fetch for device {self.uniqueid}: {e}")
        finally:
            self.fetching_next_route = False

    def step(self, interval_seconds=5):
        """Avanza la simulación del dispositivo en el intervalo de tiempo especificado."""
        # Swap a la siguiente ruta precargada si terminamos la actual
        if (not self.route or self.current_route_index >= len(self.route) - 1) and self.next_route:
            self.route = self.next_route
            self.next_route = None
            self.current_route_index = 0
            self.segment_progress = 0.0
            self.lat = self.route[0][0]
            self.lon = self.route[0][1]

        if not self.route:
            # No hay ruta lista aún, velocidad 0
            self.speed = 0.0
            return

        if self.is_stopped:
            self.stop_remaining_ticks -= 1
            self.speed = 0.0
            if self.stop_remaining_ticks <= 0:
                self.is_stopped = False
        else:
            # 2% de probabilidad de detenerse (semáforo, cruce, entrega)
            if random.random() < 0.02:
                self.is_stopped = True
                self.stop_remaining_ticks = random.randint(3, 12)  # 15s a 60s (con ticks de 5s)
                self.speed = 0.0
            else:
                # Velocidad típica en ciudad (25 a 55 km/h)
                self.speed = random.uniform(25.0, 55.0)
                
                # Distancia recorrida en este tick (metros)
                distance_meters = (self.speed * 1000.0 / 3600.0) * interval_seconds
                self._advance_position(distance_meters)

    def _advance_position(self, distance_meters):
        """Interpola la posición a lo largo de los segmentos de carretera."""
        while distance_meters > 0:
            if self.current_route_index >= len(self.route) - 1:
                # Fin de ruta alcanzado
                self.speed = 0.0
                break
                
            p1 = self.route[self.current_route_index]
            p2 = self.route[self.current_route_index + 1]
            
            seg_dist = haversine(p1[0], p1[1], p2[0], p2[1])
            seg_remaining = seg_dist - self.segment_progress
            
            if distance_meters < seg_remaining:
                self.segment_progress += distance_meters
                fraction = self.segment_progress / seg_dist
                self.lat = p1[0] + fraction * (p2[0] - p1[0])
                self.lon = p1[1] + fraction * (p2[1] - p1[1])
                self.course = calculate_bearing(p1[0], p1[1], p2[0], p2[1])
                distance_meters = 0
            else:
                distance_meters -= seg_remaining
                self.current_route_index += 1
                self.segment_progress = 0.0
                self.lat = p2[0]
                self.lon = p2[1]
                if self.current_route_index < len(self.route) - 1:
                    next_p = self.route[self.current_route_index + 1]
                    self.course = calculate_bearing(p2[0], p2[1], next_p[0], next_p[1])

def send_ping(device):
    """Envía la telemetría actual a Traccar vía OsmAnd HTTP."""
    global pings_success, pings_failed
    # Convertir velocidad de km/h a nudos (Traccar estándar interno)
    speed_knots = device.speed * 0.539957
    params = {
        "id": device.uniqueid,
        "lat": f"{device.lat:.6f}",
        "lon": f"{device.lon:.6f}",
        "speed": f"{speed_knots:.2f}",
        "bearing": f"{device.course:.1f}",
        "hdop": "1.0",
        "batt": "95"
    }
    url = f"{INGEST_URL}?{urllib.parse.urlencode(params)}"
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            success = (response.status == 200)
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Error pinging {device.uniqueid}: {e}", flush=True)
        success = False

    with stats_lock:
        if success:
            pings_success += 1
        else:
            pings_failed += 1

    return success

def run_simulation():
    global pings_success, pings_failed
    devices = []
    # Inicializar colaboradores simulados
    for city, info in CITIES.items():
        for idx in info["devices"]:
            devices.append(
                SimulatedDevice(
                    index=idx,
                    city_name=city,
                    center_lat=info["lat"],
                    center_lon=info["lon"],
                    city_range=info["range"]
                )
            )

    print(f"[{time.strftime('%H:%M:%S')}] Iniciando carga de rutas OSRM para {len(devices)} dispositivos...")

    # Separamos los pools de hilos para evitar que peticiones OSRM lentas bloqueen los pings rapidos
    with ThreadPoolExecutor(max_workers=50) as ping_executor, ThreadPoolExecutor(max_workers=10) as route_executor:
        
        # Disparar descarga inicial de rutas usando el route_executor
        for d in devices:
            d.update_route_if_needed(route_executor)
            
        # Esperar hasta que todos tengan al menos su primera ruta
        ready_count = 0
        while ready_count < len(devices):
            ready_count = sum(1 for d in devices if d.next_route is not None)
            print(f"Cargando rutas iniciales: {ready_count}/100 listas...", end="\r")
            time.sleep(0.5)
            
        # Aplicar ruta cargada
        for d in devices:
            d.route = d.next_route
            d.next_route = None
            d.lat = d.route[0][0]
            d.lon = d.route[0][1]
            d.current_route_index = 0
            
        print(f"\n[{time.strftime('%H:%M:%S')}] ¡Todas las rutas por carreteras cargadas con éxito! Iniciando bucle en vivo...")

        pings_processed = 0

        while True:
            # 5 segundos distribuidos entre los 100 dispositivos = 50ms por dispositivo
            delay = 5.0 / len(devices)
            
            for d in devices:
                start_device = time.time()
                
                # Avanzar simulación
                d.step(interval_seconds=5.0)
                d.update_route_if_needed(route_executor)

                # Ejecutar ping en el pool de hilos de pings (ping_executor)
                ping_executor.submit(send_ping, d)
                
                pings_processed += 1
                if pings_processed >= len(devices):
                    # Reportar estadísticas del ciclo
                    with stats_lock:
                        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Ciclo de 5s completado. Pings Exitosos: {pings_success}/100, Fallidos: {pings_failed}/100", flush=True)
                        pings_success = 0
                        pings_failed = 0
                    pings_processed = 0

                # Ajustar el sleep restando el tiempo de ejecución de CPU para mantener exactitud
                elapsed = time.time() - start_device
                sleep_time = max(0.001, delay - elapsed)
                time.sleep(sleep_time)

if __name__ == "__main__":
    run_simulation()
