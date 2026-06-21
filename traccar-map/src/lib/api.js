const BASE = ''

let cookie = ''

async function request(method, path, body) {
  const opts = { method, headers: {} }
  if (body instanceof FormData) {
    opts.body = body
  } else if (body) {
    opts.headers['Content-Type'] = 'application/json'
    opts.body = JSON.stringify(body)
  }
  const res = await fetch(BASE + path, opts)
  if (res.status === 401) { cookie = ''; return null }
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('json')) return res.json()
  return res.text()
}

export async function login(email, password) {
  const fd = new FormData()
  fd.append('email', email)
  fd.append('password', password)
  const res = await fetch(BASE + '/api/session', { method: 'POST', body: fd })
  if (!res.ok) return null
  cookie = document.cookie
  return res.json()
}

export async function checkSession() {
  const res = await fetch(BASE + '/api/session', { credentials: 'include' })
  if (res.status === 200) return res.json()
  return null
}

export async function logout() {
  await fetch(BASE + '/api/session', { method: 'DELETE', credentials: 'include' })
  cookie = ''
}

export function getDevices() {
  return request('GET', '/api/devices')
}

export function getPositions(deviceId) {
  const q = deviceId ? `?deviceId=${deviceId}` : ''
  return request('GET', '/api/positions' + q)
}

export function getLatestPositions() {
  return request('GET', '/api/positions?latest=true')
}

let ws = null
let wsReconnectTimer = null

export function connectWebSocket(onPosition, onDevice, onEvent) {
  function connect() {
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    ws = new WebSocket(`${proto}//${location.host}/api/socket`)
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'positions' && onPosition) onPosition(msg.data)
        if (msg.type === 'devices' && onDevice) onDevice(msg.data)
        if (msg.type === 'events' && onEvent) onEvent(msg.data)
      } catch (err) { /* ignore parse errors */ }
    }
    ws.onclose = () => {
      wsReconnectTimer = setTimeout(connect, 5000)
    }
    ws.onerror = () => ws?.close()
  }
  connect()
  return () => {
    clearTimeout(wsReconnectTimer)
    ws?.close()
  }
}
