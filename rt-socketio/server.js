import { createServer } from './src/createServer.js'
import { log } from './src/logger.js'

const { server, config } = createServer()

server.listen(config.port, () => {
  log.info(`Socket.IO up on :${config.port}`)
  log.info(`CORS=${config.corsOrigins.join(',')} API_BASE=${config.apiBase} REQUIRE_AUTH=${config.requireAuth}`)
})
