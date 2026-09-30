import { RT_OPTIONS } from '../config.js'

const BADGE = {
  idle: { color: '#94a3b8', text: 'Sin tiempo real' },
  connecting: { color: '#fbbf24', text: 'Conectando…' },
  connected: { color: '#34d399', text: 'En vivo' },
  error: { color: '#f87171', text: 'Error' },
}

export default function RealtimeSelector({ tech, onChange, status = 'idle', error = null }) {
  const badge = BADGE[status] || BADGE.idle
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <label htmlFor="rt-tech">Tiempo real</label>
      <select
        id="rt-tech"
        className="input"
        style={{ width: 'auto' }}
        value={tech}
        onChange={(e) => onChange(e.target.value)}
      >
        {RT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span data-testid="rt-status" style={{ color: badge.color, fontWeight: 600 }}>
        ● {badge.text}
      </span>
      {error && (
        <span role="alert" style={{ color: '#fecaca' }}>
          {error}
        </span>
      )}
    </div>
  )
}
