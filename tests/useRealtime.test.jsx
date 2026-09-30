import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Sockets simulados: no se necesita ningún servidor
const handlers = {}
const fakeSocket = {
  connected: true,
  id: 'sock-1',
  on: vi.fn((event, cb) => {
    handlers[event] = cb
  }),
  emit: vi.fn(),
  removeAllListeners: vi.fn(),
  disconnect: vi.fn(),
}
vi.mock('../src/lib/socketIoClient.js', () => ({ createSocket: vi.fn(() => fakeSocket) }))

const stompHandlers = { subscribed: null }
const fakeStomp = {
  connected: true,
  activate: vi.fn(),
  deactivate: vi.fn(),
  publish: vi.fn(),
  subscribe: vi.fn(),
}
vi.mock('../src/lib/stompClient.js', () => ({
  createStompClient: vi.fn(() => fakeStomp),
  subscribeBlueprint: vi.fn((_c, room, cb) => {
    stompHandlers.subscribed = { room, cb }
  }),
}))

import useRealtime from '../src/hooks/useRealtime.js'
import { createSocket } from '../src/lib/socketIoClient.js'

beforeEach(() => {
  vi.clearAllMocks()
  Object.keys(handlers).forEach((k) => delete handlers[k])
  stompHandlers.subscribed = null
  localStorage.setItem('token', 'jwt-de-prueba')
})

describe('useRealtime', () => {
  it('con tech=none no abre ninguna conexión', () => {
    const { result } = renderHook(() =>
      useRealtime({ tech: 'none', author: 'juan', name: 'p1', onPoints: () => {} }),
    )
    expect(result.current.status).toBe('idle')
    expect(createSocket).not.toHaveBeenCalled()
  })

  it('Socket.IO: se une a la sala al conectar, envía y recibe puntos', () => {
    const onPoints = vi.fn()
    const { result } = renderHook(() =>
      useRealtime({ tech: 'socketio', author: 'juan', name: 'p1', onPoints }),
    )
    expect(createSocket).toHaveBeenCalledWith(expect.any(String), 'jwt-de-prueba')

    act(() => handlers.connect())
    expect(result.current.status).toBe('connected')
    expect(fakeSocket.emit).toHaveBeenCalledWith(
      'join-room',
      'blueprints.juan.p1',
      { author: 'juan', name: 'p1' },
      expect.any(Function),
    )

    act(() => result.current.sendPoint({ x: 3, y: 4 }))
    expect(fakeSocket.emit).toHaveBeenCalledWith('draw-event', {
      room: 'blueprints.juan.p1',
      author: 'juan',
      name: 'p1',
      point: { x: 3, y: 4 },
    })

    act(() => handlers['blueprint-update']({ author: 'juan', name: 'p1', points: [{ x: 9, y: 9 }] }))
    expect(onPoints).toHaveBeenCalledWith([{ x: 9, y: 9 }])

    // actualizaciones de otro plano se ignoran
    act(() => handlers['blueprint-update']({ author: 'juan', name: 'otro', points: [{ x: 1, y: 1 }] }))
    expect(onPoints).toHaveBeenCalledTimes(1)
  })

  it('Socket.IO: sin sesión muestra un error legible', () => {
    const { result } = renderHook(() =>
      useRealtime({ tech: 'socketio', author: 'juan', name: 'p1', onPoints: () => {} }),
    )
    act(() => handlers.connect_error(new Error('unauthorized')))
    expect(result.current.status).toBe('error')
    expect(result.current.error).toMatch(/sesión/i)
  })

  it('STOMP: publica en /app/draw con clientId e ignora su propio eco', () => {
    const onPoints = vi.fn()
    const { result } = renderHook(() =>
      useRealtime({ tech: 'stomp', author: 'juan', name: 'p1', onPoints }),
    )
    expect(fakeStomp.activate).toHaveBeenCalled()
    act(() => fakeStomp.onConnect())
    expect(result.current.status).toBe('connected')
    expect(stompHandlers.subscribed.room).toBe('blueprints.juan.p1')

    act(() => result.current.sendPoint({ x: 5, y: 6 }))
    const sent = fakeStomp.publish.mock.calls[0][0]
    expect(sent.destination).toBe('/app/draw')
    const body = JSON.parse(sent.body)
    expect(body).toMatchObject({ author: 'juan', name: 'p1', point: { x: 5, y: 6 } })
    expect(body.clientId).toBeTruthy()

    act(() => stompHandlers.subscribed.cb({ author: 'juan', name: 'p1', points: [{ x: 5, y: 6 }], clientId: body.clientId }))
    expect(onPoints).not.toHaveBeenCalled() // eco propio

    act(() => stompHandlers.subscribed.cb({ author: 'juan', name: 'p1', points: [{ x: 7, y: 8 }], clientId: 'otro' }))
    expect(onPoints).toHaveBeenCalledWith([{ x: 7, y: 8 }])
  })

  it('limpia la conexión al desmontar', () => {
    const { unmount } = renderHook(() =>
      useRealtime({ tech: 'socketio', author: 'juan', name: 'p1', onPoints: () => {} }),
    )
    unmount()
    expect(fakeSocket.disconnect).toHaveBeenCalled()
  })
})
