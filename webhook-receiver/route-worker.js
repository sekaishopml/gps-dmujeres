// Route Web Worker
// Procesa arrays de coordenadas en segundo plano sin bloquear el UI

self.onmessage = function (e) {
  const { type, data } = e.data;

  if (type === "parse") {
    // Recibe JSON crudo de posiciones, devuelve arrays planos
    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const points = Array.isArray(parsed) ? parsed : [];

      const result = {
        type: "parsed",
        count: points.length,
        bounds: null,
        simplified: [],
      };

      if (points.length === 0) {
        self.postMessage(result);
        return;
      }

      // Convertir a arrays planos + calcular bounds
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      const flat = [];

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const lat = p.latitude ?? p.lat ?? p[0];
        const lng = p.longitude ?? p.lng ?? p[1];
        const t = p.serverTime ?? p.deviceTime ?? p.fixTime ?? p[2];
        const spd = p.speed ?? p[3] ?? 0;
        const course = p.course ?? p[4] ?? 0;

        if (lat < minLat) minLat = lat;
        if (lat > maxLat) maxLat = lat;
        if (lng < minLng) minLng = lng;
        if (lng > maxLng) maxLng = lng;

        flat.push([lat, lng, t, spd, course]);
      }

      result.bounds = { minLat, maxLat, minLng, maxLng };
      result.simplified = flat;

      self.postMessage(result);
    } catch (err) {
      self.postMessage({ type: "error", message: err.message });
    }
  }

  if (type === "filter") {
    // Filtra puntos visibles según viewport (bounds)
    const { points, bounds } = data;
    if (!points || !bounds) {
      self.postMessage({ type: "filtered", count: 0, visible: [] });
      return;
    }

    const visible = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const lat = p[0];
      const lng = p[1];
      if (
        lat >= bounds.south &&
        lat <= bounds.north &&
        lng >= bounds.west &&
        lng <= bounds.east
      ) {
        visible.push(p);
      }
    }

    self.postMessage({
      type: "filtered",
      total: points.length,
      count: visible.length,
      visible: visible,
    });
  }
};
