import { writable, derived } from 'svelte/store'

export const user = writable(null)
export const devices = writable([])
export const positions = writable({})
export const selectedDeviceId = writable(null)
export const mapInstance = writable(null)
export const showPositionHistory = writable(false)
export const isAuthenticated = derived(user, $user => $user !== null)
