<script>
  import { createEventDispatcher } from 'svelte'
  const dispatch = createEventDispatcher()
  let email = 'admin@dmujeres.com'
  let password = ''
  let error = ''
  let loading = false

  async function handleSubmit() {
    error = ''
    loading = true
    const ok = await fetch('/api/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`
    })
    if (ok.ok) {
      dispatch('login')
    } else {
      error = 'Credenciales incorrectas'
      loading = false
    }
  }
</script>

<div class="login-screen">
  <div class="login-card">
    <div class="logo">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1976d2" stroke-width="2">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        <circle cx="12" cy="9" r="2.5" fill="#1976d2" stroke="none"/>
      </svg>
    </div>
    <h1>DMujeres GPS</h1>
    <p class="subtitle">Inicia sesión para continuar</p>
    <form on:submit|preventDefault={handleSubmit}>
      <div class="field">
        <input type="email" bind:value={email} placeholder="Correo electrónico" required />
      </div>
      <div class="field">
        <input type="password" bind:value={password} placeholder="Contraseña" required />
      </div>
      {#if error}<div class="error">{error}</div>{/if}
      <button type="submit" disabled={loading}>
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  </div>
</div>

<style>
  .login-screen {
    height: 100%; display: flex; align-items: center; justify-content: center;
    background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  }
  .login-card {
    background: #1a1a2e; padding: 2.5rem; border-radius: 16px;
    width: 360px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    border: 1px solid #2a2a4a;
  }
  .logo { text-align: center; margin-bottom: 1rem; }
  h1 { text-align: center; color: #e0e0e0; font-size: 1.5rem; margin-bottom: 0.25rem; }
  .subtitle { text-align: center; color: #888; font-size: 0.85rem; margin-bottom: 1.5rem; }
  .field { margin-bottom: 1rem; }
  input {
    width: 100%; padding: 0.75rem 1rem; border-radius: 8px;
    border: 1px solid #333; background: #16213e;
    color: #e0e0e0; font-size: 0.9rem; outline: none;
  }
  input:focus { border-color: #1976d2; }
  button {
    width: 100%; padding: 0.75rem; border-radius: 8px;
    border: none; background: #1976d2; color: white;
    font-size: 1rem; font-weight: 600; cursor: pointer;
  }
  button:hover { background: #1565c0; }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
  .error { color: #f44336; font-size: 0.85rem; margin-bottom: 1rem; text-align: center; }
</style>
