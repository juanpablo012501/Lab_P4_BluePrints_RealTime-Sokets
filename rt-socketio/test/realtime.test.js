import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { io as connect } from 'socket.io-client'
import { createServer } from '../src/createServer.js'

const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const once = (socket, event, ms = 1500) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout esperando ${event}`)), ms)
    socket.once(event, (data) => {
      clearTimeout(t)
      resolve(data)
    })
  })
const room = (a, n) => `blueprints.${a}.${n}`

// API Spring simulada: token "good" solo puede leer juan/plano-1 y juan/plano-2
let fakeApi
let apiBase
before(async () => {
  fakeApi = http.createServer((req, res) => {
    const ok = req.headers.authorization === 'Bearer good'
    if (!ok) return res.writeHead(401).end()
    if (/^\/api\/v1\/blueprints\/juan\/plano-[12]$/.test(req.url)) return res.writeHead(200).end('{}')
    res.writeHead(404).end()
  })
  await new Promise((r) => fakeApi.listen(0, r))
  apiBase = `http://localhost:${fakeApi.address().port}`
})
after(() => fakeApi.close())

async function start(overrides) {
  const srv = createServer({ port: 0, corsOrigins: ['*'], ...overrides })
  await new Promise((r) => srv.server.listen(0, r))
  const url = `http://localhost:${srv.server.address().port}`
  const clients = []
  const client = (auth) => {
    const c = connect(url, { transports: ['websocket'], auth, reconnection: false })
    clients.push(c)
    return c
  }
  const stop = async () => {
    clients.forEach((c) => c.close())
    srv.io.close()
    await new Promise((r) => srv.server.close(r))
  }
  return { url, client, stop }
}

test('modo abierto: broadcast a la sala, sin eco y aislado por plano', async () => {
  const s = await start({ requireAuth: false })
  const [a, b, c] = [s.client(), s.client(), s.client()]
  await Promise.all([once(a, 'connect'), once(b, 'connect'), once(c, 'connect')])
  a.emit('join-room', room('juan', 'plano-1'))
  b.emit('join-room', room('juan', 'plano-1'))
  c.emit('join-room', room('juan', 'plano-2'))
  await wait(150)

  const got = { a: [], b: [], c: [] }
  a.on('blueprint-update', (u) => got.a.push(u))
  b.on('blueprint-update', (u) => got.b.push(u))
  c.on('blueprint-update', (u) => got.c.push(u))

  a.emit('draw-event', { room: room('juan', 'plano-1'), author: 'juan', name: 'plano-1', point: { x: 10, y: 20 } })
  await wait(250)

  assert.deepEqual(got.b, [{ author: 'juan', name: 'plano-1', points: [{ x: 10, y: 20 }] }])
  assert.equal(got.a.length, 0, 'el emisor no recibe su propio punto')
  assert.equal(got.c.length, 0, 'otro plano no recibe nada')
  await s.stop()
})

test('valida payloads y exige join-room previo', async () => {
  const s = await start({ requireAuth: false })
  const a = s.client()
  await once(a, 'connect')

  const noJoin = once(a, 'rt-error')
  a.emit('draw-event', { room: room('juan', 'p'), author: 'juan', name: 'p', point: { x: 1, y: 1 } })
  assert.equal((await noJoin).code, 'not-joined')

  a.emit('join-room', room('juan', 'p'))
  await wait(100)
  const bad = once(a, 'rt-error')
  a.emit('draw-event', { room: room('juan', 'p'), author: 'juan', name: 'p', point: { x: 'hola', y: 1 } })
  assert.equal((await bad).code, 'invalid')

  const mismatch = once(a, 'rt-error')
  a.emit('draw-event', { room: room('otro', 'p'), author: 'juan', name: 'p', point: { x: 1, y: 1 } })
  assert.equal((await mismatch).code, 'invalid')
  await s.stop()
})

test('con auth: sin token no conecta; token inválido / plano inexistente se rechazan; token bueno entra', async () => {
  const s = await start({ requireAuth: true, apiBase })

  const anon = s.client()
  const err = await once(anon, 'connect_error')
  assert.equal(err.message, 'unauthorized')

  const bad = s.client({ token: 'malo' })
  await once(bad, 'connect')
  const r1 = await bad.emitWithAck('join-room', room('juan', 'plano-1'), { author: 'juan', name: 'plano-1' })
  assert.equal(r1.code, 'unauthorized')

  const good = s.client({ token: 'good' })
  await once(good, 'connect')
  const r2 = await good.emitWithAck('join-room', room('juan', 'plano-1'), { author: 'juan', name: 'plano-1' })
  assert.deepEqual(r2, { ok: true, room: room('juan', 'plano-1') })
  const r3 = await good.emitWithAck('join-room', room('juan', 'nope'), { author: 'juan', name: 'nope' })
  assert.equal(r3.code, 'not-found')
  const r4 = await good.emitWithAck('join-room', room('juan', 'plano-2'), { author: 'juan', name: 'plano-1' })
  assert.equal(r4.code, 'invalid', 'la sala debe corresponder al author/name declarado')
  await s.stop()
})

test('GET /health responde estado', async () => {
  const s = await start({ requireAuth: false })
  const res = await fetch(`${s.url}/health`)
  const body = await res.json()
  assert.equal(body.status, 'ok')
  await s.stop()
})
