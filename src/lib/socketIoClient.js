import { io } from 'socket.io-client'

/** Cliente Socket.IO forzando WebSocket. El JWT viaja en el handshake (auth.token). */
export function createSocket(baseUrl, token) {
  return io(baseUrl, {
    transports: ['websocket'],
    auth: { token },
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  })
}
