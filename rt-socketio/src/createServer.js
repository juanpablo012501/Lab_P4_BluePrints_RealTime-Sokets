import express from 'express'
import cors from 'cors'
import http from 'node:http'
import { Server } from 'socket.io'
import { loadConfig } from './config.js'
import { log } from './logger.js'
import { canAccessBlueprint } from './authorize.js'
import { blueprintRef, drawEventSchema, roomOf } from './schemas.js'

const ERROR_MESSAGES = {
  invalid: 'Payload inválido',
  unauthorized: 'Token inválido o sin permisos sobre este plano',
  'not-found': 'El plano no existe',
  'auth-unavailable': 'No se pudo verificar el acceso con la API',
  'not-joined': 'Debes hacer join-room antes de dibujar',
}

/**
 * Contrato (idéntico al backend guía):
 *   cliente -> servidor:  join-room(room[, {author,name}][, ack])   draw-event({room,author,name,point})
 *   servidor -> clientes: blueprint-update({author,name,points:[{x,y}]})   (no incluye al emisor)
 *   servidor -> cliente:  rt-error({event,code,message})
 */
export function createServer(overrides = {}) {
  const config = { ...loadConfig(), ...overrides }

  const app = express()
  app.use(cors({ origin: config.corsOrigins }))
  app.use(express.json())

  const server = http.createServer(app)
  const io = new Server(server, { cors: { origin: config.corsOrigins } })

  app.get('/health', (_req, res) =>
    res.json({
      status: 'ok',
      uptime: Math.round(process.uptime()),
      clients: io.engine.clientsCount,
      rooms: [...io.sockets.adapter.rooms.keys()].filter((r) => r.startsWith('blueprints.')).length,
      requireAuth: config.requireAuth,
    }),
  )

  io.use((socket, next) => {
    if (config.requireAuth && !socket.handshake.auth?.token) {
      log.warn(`conexión rechazada (sin token) id=${socket.id}`)
      return next(new Error('unauthorized'))
    }
    next()
  })

  io.on('connection', (socket) => {
    log.info(`conectado id=${socket.id} clientes=${io.engine.clientsCount}`)
    const reject = (event, code, ack) => {
      const payload = { event, code, message: ERROR_MESSAGES[code] || code }
      log.warn(`${event} rechazado id=${socket.id} code=${code}`)
      socket.emit('rt-error', payload)
      if (typeof ack === 'function') ack({ ok: false, ...payload })
    }

    socket.on('join-room', async (room, meta, maybeAck) => {
      const ack = typeof meta === 'function' ? meta : maybeAck
      const ref = blueprintRef.safeParse(typeof meta === 'function' ? undefined : meta)
      if (typeof room !== 'string' || !room.startsWith('blueprints.')) return reject('join-room', 'invalid', ack)

      if (config.requireAuth) {
        if (!ref.success || roomOf(ref.data) !== room) return reject('join-room', 'invalid', ack)
        const verdict = await canAccessBlueprint({
          apiBase: config.apiBase,
          token: socket.handshake.auth.token,
          ...ref.data,
        })
        if (!verdict.ok) return reject('join-room', verdict.code, ack)
      }

      await socket.join(room)
      log.info(`join id=${socket.id} room=${room} miembros=${io.sockets.adapter.rooms.get(room)?.size}`)
      if (typeof ack === 'function') ack({ ok: true, room })
    })

    socket.on('leave-room', (room) => {
      if (typeof room !== 'string') return
      socket.leave(room)
      log.info(`leave id=${socket.id} room=${room}`)
    })

    socket.on('draw-event', (payload) => {
      const parsed = drawEventSchema.safeParse(payload)
      if (!parsed.success) return reject('draw-event', 'invalid')
      const { room, author, name, point } = parsed.data
      if (room !== roomOf({ author, name })) return reject('draw-event', 'invalid')
      if (!socket.rooms.has(room)) return reject('draw-event', 'not-joined')
      socket.to(room).emit('blueprint-update', { author, name, points: [point] })
    })

    socket.on('disconnect', (reason) => {
      log.info(`desconectado id=${socket.id} motivo=${reason}`)
    })
  })

  return { app, server, io, config }
}
