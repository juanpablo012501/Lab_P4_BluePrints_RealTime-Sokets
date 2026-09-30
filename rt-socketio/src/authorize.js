/**
 * Autoriza el acceso a un plano delegando en la API Spring (P3):
 * la API es la única que conoce las llaves del JWT, así que se le pregunta con el token del usuario.
 *   200 -> permitido | 401/403 -> no autorizado | 404 -> el plano no existe
 */
export async function canAccessBlueprint({ apiBase, token, author, name, fetchImpl = fetch }) {
  const url = `${apiBase}/api/v1/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`
  try {
    const res = await fetchImpl(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) return { ok: true }
    if (res.status === 401 || res.status === 403) return { ok: false, code: 'unauthorized' }
    if (res.status === 404) return { ok: false, code: 'not-found' }
    return { ok: false, code: 'auth-unavailable' }
  } catch {
    return { ok: false, code: 'auth-unavailable' }
  }
}
