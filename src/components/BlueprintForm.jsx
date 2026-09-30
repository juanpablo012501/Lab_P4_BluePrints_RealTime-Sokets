import { useState } from 'react'

export default function BlueprintForm({ onSubmit }) {
  const [author, setAuthor] = useState('')
  const [name, setName] = useState('')
  const [pointsJSON, setPointsJSON] = useState('[{"x":10,"y":10},{"x":40,"y":60}]')

  const handle = (e) => {
    e.preventDefault()
    try {
      const points = JSON.parse(pointsJSON)
      onSubmit({ author, name, points })
    } catch (e) {
      alert('JSON de puntos inválido')
    }
  }

  return (
    <form onSubmit={handle} className="card">
      <h3 style={{ marginTop: 0 }}>Crear Blueprint</h3>
      <div className="grid cols-2">
        <div>
          <label htmlFor="blueprint-author">Autor</label>
          <input
            id="blueprint-author"
            className="input"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="juan.perez"
          />
        </div>
        <div>
          <label htmlFor="blueprint-name">Nombre</label>
          <input
            id="blueprint-name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="mi-dibujo"
          />
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label htmlFor="blueprint-points">Puntos (JSON)</label>
        <textarea
          id="blueprint-points"
          className="input"
          rows="5"
          value={pointsJSON}
          onChange={(e) => setPointsJSON(e.target.value)}
        />
      </div>
      <div style={{ marginTop: 12 }}>
        <button className="btn primary">Guardar</button>
      </div>
    </form>
  )
}
