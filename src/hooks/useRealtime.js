import { useCallback, useEffect, useRef, useState } from 'react'
import { IO_BASE, STOMP_BASE, roomOf } from '../config.js'
import { createSocket } from '../lib/socketIoClient.js'
import { createStompClient, subscribeBlueprint } from '../lib/stompClient.js'

// Identifica esta pestaña: STOMP retransmite también al emisor y así se ignora su propio eco.
const CLIENT_ID =
  globalThis.crypto?.randomUUID?.() ?? `c-${Math.random().toString(36).slice(2)}${Date.now()}`

const getToken = () => localStorage.getItem('token')

/**
 * Colaboración en tiempo real sobre un plano (sala/tópico `blueprints.{author}.{name}`).
 *  - tech: 'none' | 'socketio' | 'stomp'
 *  - onPoints(points): se invoca con los puntos NUEVOS enviados por otros clientes
 * Devuelve { status: 'idle'|'connecting'|'connected'|'error', error, sendPoint }.
 */
export default function useRealtime({ tech, author, name, onPoints }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const senderRef = useRef(null)
  const onPointsRef = useRef(onPoints)

  useEffect(() => {
    onPointsRef.current = onPoints
  })

  useEffect(() => {
    senderRef.current = null
    setError(null)
    if (tech === 'none' || !author || !name) {
      setStatus('idle')
      return undefined
    }

    const room = roomOf(author, name)
    const emit = (points) => points?.length && onPointsRef.current?.(points)
    const fail = (message) => {
      setStatus('error')
      setError(message)
    }
    setStatus('connecting')

    if (tech === 'socketio') {
      const socket = createSocket(IO_BASE, getToken())
      // join-room va en 'connect' para que también se re-una tras una reconexión
      socket.on('connect', () => {
        console.info(`[rt] socket.io conectado id=${socket.id} room=${room}`)
        setStatus('connected')
        socket.emit('join-room', room, { author, name }, (ack) => {
          if (ack && ack.ok === false) fail(ack.message || 'No se pudo unir a la sala')
        })
      })
      socket.on('disconnect', (reason) => {
        console.warn(`[rt] socket.io desconectado: ${reason}`)
        setStatus('connecting')
      })
      socket.on('connect_error', (e) =>
        fail(e.message === 'unauthorized' ? 'Inicia sesión para usar tiempo real' : `Sin conexión: ${e.message}`),
      )
      socket.on('rt-error', (e) => console.warn('[rt] rt-error', e))
      socket.on('blueprint-update', (u) => {
        if (u.author === author && u.name === name) emit(u.points)
      })
      senderRef.current = (point) =>
        socket.connected && socket.emit('draw-event', { room, author, name, point })
      return () => {
        senderRef.current = null
        socket.removeAllListeners()
        socket.disconnect()
      }
    }

    // STOMP
    const client = createStompClient(STOMP_BASE, getToken)
    client.onConnect = () => {
      console.info(`[rt] STOMP conectado room=${room}`)
      setStatus('connected')
      subscribeBlueprint(client, room, (u) => {
        if (u.clientId === CLIENT_ID) return
        emit(u.points)
      })
    }
    client.onWebSocketClose = () => setStatus((s) => (s === 'error' ? s : 'connecting'))
    client.onStompError = (frame) => {
      console.error('[rt] STOMP error', frame.headers?.message)
      fail('STOMP rechazó la conexión (¿iniciaste sesión?)')
      client.deactivate() // evita reintentos infinitos con un token inválido
    }
    client.activate()
    senderRef.current = (point) =>
      client.connected &&
      client.publish({
        destination: '/app/draw',
        body: JSON.stringify({ author, name, point, clientId: CLIENT_ID }),
      })
    return () => {
      senderRef.current = null
      client.deactivate()
    }
  }, [tech, author, name])

  const sendPoint = useCallback((point) => senderRef.current?.(point), [])
  return { status, error, sendPoint }
}
