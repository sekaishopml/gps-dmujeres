<script>
  import { devices, positions, selectedDeviceId, user } from './stores.js'
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher()

  $: deviceList = ($devices || []).map(d => ({
    ...d,
    pos: $positions[d.id] || null,
    online: d.status === 'online',
    lastUpdate: d.lastUpdate || (d.pos?.serverTime || null)
  }))

  $: onlineCount = deviceList.filter(d => d.online).length

  function formatTime(ts) {
    if (!ts) return '-'
    const d = new Date(ts)
    return d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })
  }

  function formatSpeed(speed) {
    if (speed == null) return '-'
    return (speed * 1.852).toFixed(0) + ' km/h'
  }
</script>

<div class="panel">
  <div class="header">
    <h1>DMujeres GPS</h1>
    <span class="badge">{$user?.name || 'Admin'}</span>
    <button class="logout-btn" on:click={() => dispatch('logout')} title="Cerrar sesión">✕</button>
  </div>

  <div class="stats">
    <span class="stat online">{onlineCount} online</span>
    <span class="stat total">{deviceList.length} total</span>
  </div>

  <div class="search">
    <input type="text" placeholder="Buscar dispositivo..." bind:value={search} />
  </div>

  <div class="device-list">
    {#each deviceList.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase())) as device}
      <div
        class="device-item"
        class:selected={$selectedDeviceId === device.id}
        class:online={device.online}
        on:click={() => dispatch('select', device.id)}
      >
        <div class="dot"></div>
        <div class="info">
          <span class="name">{device.name}</span>
          <span class="meta">
            {device.pos ? formatSpeed(device.pos.speed) + ' · ' : ''}
            {formatTime(device.lastUpdate)}
          </span>
        </div>
        <span class="uid">{device.uniqueId}</span>
      </div>
    {/each}
    {#if deviceList.length === 0}
      <div class="empty">No hay dispositivos</div>
    {/if}
  </div>
</div>

<script context="module">
  let search = ''
</script>

<style>
  .panel {
    width: 320px; min-width: 320px; height: 100%;
    display: flex; flex-direction: column;
    background: #1a1a2e; color: #e0e0e0;
    border-right: 1px solid #2a2a4a;
  }
  .header {
    padding: 1rem; display: flex; align-items: center; gap: 0.5rem;
    background: #16162a; border-bottom: 1px solid #2a2a4a;
  }
  .header h1 { font-size: 1rem; font-weight: 600; flex: 1; }
  .badge {
    font-size: 0.7rem; padding: 2px 8px; border-radius: 10px;
    background: #1976d2; color: white;
  }
  .logout-btn {
    background: none; border: none; color: #888; cursor: pointer;
    font-size: 1rem; padding: 2px 6px; border-radius: 4px;
  }
  .logout-btn:hover { background: #333; color: #fff; }
  .stats {
    padding: 0.5rem 1rem; display: flex; gap: 1rem;
    font-size: 0.8rem; border-bottom: 1px solid #2a2a4a;
  }
  .stat.online { color: #4caf50; }
  .stat.total { color: #888; }
  .search {
    padding: 0.5rem; border-bottom: 1px solid #2a2a4a;
  }
  .search input {
    width: 100%; padding: 0.5rem; border-radius: 6px;
    border: 1px solid #333; background: #16213e;
    color: #e0e0e0; font-size: 0.85rem; outline: none;
  }
  .search input:focus { border-color: #1976d2; }
  .device-list { flex: 1; overflow-y: auto; }
  .device-item {
    display: flex; align-items: center; gap: 0.75rem;
    padding: 0.75rem 1rem; cursor: pointer;
    border-bottom: 1px solid #1f1f3a; transition: background 0.15s;
  }
  .device-item:hover { background: #1f1f3a; }
  .device-item.selected { background: #0d47a1; }
  .dot {
    width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
    background: #666;
  }
  .device-item.online .dot { background: #4caf50; box-shadow: 0 0 6px #4caf50; }
  .info { flex: 1; min-width: 0; }
  .name { display: block; font-size: 0.9rem; font-weight: 500; }
  .meta { display: block; font-size: 0.75rem; color: #888; margin-top: 2px; }
  .uid {
    font-size: 0.65rem; color: #555;
    font-family: monospace;
  }
  .empty {
    padding: 2rem; text-align: center; color: #666;
  }
</style>
