<script>
  import { onMount, onDestroy } from 'svelte'
  import { user as userStore, devices, positions, selectedDeviceId } from './lib/stores.js'
  import { checkSession, logout, getDevices, getPositions, connectWebSocket } from './lib/api.js'
  import MapView from './lib/MapView.svelte'
  import DevicePanel from './lib/DevicePanel.svelte'
  import Login from './lib/Login.svelte'

  let ready = false
  let loggedIn = false
  let polling

  async function loadData() {
    const [devs, pos] = await Promise.all([getDevices(), getPositions()])
    if (devs) {
      devices.set(devs)
      const pm = {}
      for (const p of pos || []) pm[p.deviceId] = p
      positions.set(pm)
    }
  }

  onMount(async () => {
    const u = await checkSession()
    if (u) {
      userStore.set(u)
      loggedIn = true
      await loadData()
      polling = setInterval(loadData, 5000)
      connectWebSocket(
        data => {
          const pm = {}
          for (const p of data) pm[p.deviceId] = p
          positions.update(x => ({ ...x, ...pm }))
        },
        data => devices.set(data),
        () => {}
      )
    }
    ready = true
  })

  onDestroy(() => {
    if (polling) clearInterval(polling)
  })

  async function handleLogin() {
    const u = await checkSession()
    if (u) {
      userStore.set(u)
      loggedIn = true
      await loadData()
      polling = setInterval(loadData, 5000)
    }
  }

  async function handleLogout() {
    await logout()
    userStore.set(null)
    devices.set([])
    positions.set({})
    selectedDeviceId.set(null)
    loggedIn = false
    if (polling) clearInterval(polling)
  }
</script>

{#if !ready}
  <div class="loading">
    <div class="spinner"></div>
  </div>
{:else if !loggedIn}
  <Login on:login={handleLogin} />
{:else}
  <div class="layout">
    <DevicePanel on:logout={handleLogout} on:select={id => selectedDeviceId.set(id)} />
    <MapView />
  </div>
{/if}

<style>
  .loading {
    height: 100%; display: flex; align-items: center; justify-content: center;
    background: #0f0c29;
  }
  .spinner {
    width: 40px; height: 40px;
    border-radius: 50%; border: 4px solid #333;
    border-right-color: #1976d2; animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .layout { height: 100%; display: flex; overflow: hidden; }
</style>
