const list = (value, fallback) =>
  (value ?? fallback)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

export function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT) || 3001,
    corsOrigins: list(env.CORS_ORIGINS, 'http://localhost:5173,http://localhost:4173'),
    apiBase: (env.API_BASE || 'http://localhost:8080').replace(/\/$/, ''),
    requireAuth: (env.REQUIRE_AUTH ?? 'true') !== 'false',
  }
}
