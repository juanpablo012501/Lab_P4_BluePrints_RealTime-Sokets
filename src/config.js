// Configuración de entorno del front (Vite). Ver .env.example
export const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
export const IO_BASE = import.meta.env.VITE_IO_BASE || 'http://localhost:3001'
export const STOMP_BASE = import.meta.env.VITE_STOMP_BASE || API_BASE

export const RT_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'socketio', label: 'Socket.IO' },
  { value: 'stomp', label: 'STOMP' },
]

export const roomOf = (author, name) => `blueprints.${author}.${name}`
