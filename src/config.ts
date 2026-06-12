export type DataMode = 'mock' | 'live'

const rawMode = (import.meta.env.VITE_DATA_MODE ?? 'mock').toLowerCase()

export const dataMode: DataMode = rawMode === 'live' ? 'live' : 'mock'
export const moonrakerUrl = import.meta.env.VITE_MOONRAKER_URL ?? 'http://127.0.0.1:7125'
