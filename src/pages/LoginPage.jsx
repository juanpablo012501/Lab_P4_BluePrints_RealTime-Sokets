import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import api from '../services/httpClient.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      let token
      if (import.meta.env.VITE_USE_MOCK === 'true') {
        if (username !== 'student' || password !== 'student123') {
          throw new Error('Invalid mock credentials')
        }
        token = 'mock-token'
      } else {
        const { data } = await api.post('/auth/login', { username, password })
        token = data.access_token || data.token
      }
      if (!token) throw new Error('The login response did not include a token')
      localStorage.setItem('token', token)
      navigate(location.state?.from?.pathname || '/')
    } catch {
      setError('Credenciales inválidas o servidor no disponible')
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2 style={{ marginTop: 0 }}>Login</h2>
      <div className="grid cols-2">
        <div>
          <label>Usuario</label>
          <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div>
          <label>Contraseña</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      {error && <p style={{ color: '#f87171' }}>{error}</p>}
      <button className="btn primary" style={{ marginTop: 12 }}>
        Ingresar
      </button>
    </form>
  )
}
