import { Client } from '@stomp/stompjs'

/**
 * Cliente STOMP sobre WebSocket nativo. El JWT se envía como header del frame CONNECT
 * (el handshake HTTP del navegador no permite headers personalizados).
 */
export function createStompClient(baseUrl, getToken) {
  return new Client({
    brokerURL: `${baseUrl.replace(/\/$/, '').replace(/^http/, 'ws')}/ws-blueprints`,
    reconnectDelay: 2000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    beforeConnect: (client) => {
      const token = getToken()
      client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {}
    },
  })
}

export function subscribeBlueprint(client, room, onMsg) {
  return client.subscribe(`/topic/${room}`, (m) => onMsg(JSON.parse(m.body)))
}
