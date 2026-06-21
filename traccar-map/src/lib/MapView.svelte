<script>
  import { onMount, onDestroy } from 'svelte'
  import { devices, positions, selectedDeviceId, mapInstance } from './stores.js'

  let mapContainer
  let map

  const unsubDevices = devices.subscribe(() => updateMarkers())
  const unsubPositions = positions.subscribe(() => updateMarkers())
  const unsubSelected = selectedDeviceId.subscribe(id => {
    if (map && id) {
      const pos = getPosition(id)
      if (pos) map.flyTo({ center: [pos.longitude, pos.latitude], zoom: 14, duration: 1000 })
    }
    updateMarkers()
  })

  function getPosition(deviceId) {
    let p
    positions.subscribe(v => p = v[deviceId])()
    return p
  }

  let geoSource = null

  function buildGeoJSON() {
    let result
    positions.subscribe($p => { result = $p })()
    let devs
    devices.subscribe($d => { devs = $d })()

    const features = []
    let selId
    selectedDeviceId.subscribe(id => { selId = id })()

    for (const d of devs || []) {
      const pos = result?.[d.id]
      if (!pos) continue
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [pos.longitude, pos.latitude] },
        properties: {
          id: d.id,
          name: d.name,
          status: d.status,
          speed: pos.speed || 0,
          course: pos.course || 0,
          selected: d.id === selId
        }
      })
    }
    return { type: 'FeatureCollection', features }
  }

  let markerTimer

  function updateMarkers() {
    if (!map || !map.getSource('devices')) return
    map.getSource('devices').setData(buildGeoJSON())
  }

  onMount(() => {
    map = new maplibregl.Map({
      container: mapContainer,
      style: {
        version: 8, name: 'DMujeres',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256, attribution: '&copy; OpenStreetMap'
          }
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm', minzoom: 0, maxzoom: 19 }],
        glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf'
      },
      center: [-78.5, -1.2], zoom: 7,
      attributionControl: true
    })

    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.addControl(new maplibregl.ScaleControl(), 'bottom-left')

    map.on('load', () => {
      map.addSource('devices', { type: 'geojson', data: buildGeoJSON() })

      map.addLayer({
        id: 'device-dots',
        type: 'circle',
        source: 'devices',
        paint: {
          'circle-radius': ['case', ['get', 'selected'], 14, 10],
          'circle-color': ['case', ['==', ['get', 'status'], 'online'], '#1976d2', '#9e9e9e'],
          'circle-stroke-width': ['case', ['get', 'selected'], 3, 1],
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9
        }
      })

      map.addLayer({
        id: 'device-labels',
        type: 'symbol',
        source: 'devices',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 12,
          'text-anchor': 'top',
          'text-offset': [0, 1.5],
          'text-font': ['Open Sans Regular']
        },
        paint: {
          'text-halo-color': '#ffffff',
          'text-halo-width': 2,
          'text-color': '#333'
        }
      })

      map.on('click', 'device-dots', (e) => {
        if (e.features?.[0]) {
          selectedDeviceId.set(e.features[0].properties.id)
        }
      })

      map.on('click', (e) => {
        if (!e.features?.length) selectedDeviceId.set(null)
      })

      mapInstance.set(map)
    })
  })

  onDestroy(() => {
    unsubDevices()
    unsubPositions()
    unsubSelected()
    map?.remove()
    mapInstance.set(null)
  })
</script>

<div bind:this={mapContainer} class="map-container"></div>

<style>
  .map-container { height: 100%; width: 100%; }
</style>
