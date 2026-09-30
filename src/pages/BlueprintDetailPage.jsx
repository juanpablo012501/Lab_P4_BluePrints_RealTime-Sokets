import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { deleteBlueprint, fetchBlueprint, updateBlueprint } from '../features/blueprints/blueprintsSlice.js'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import { useState } from 'react'

export default function BlueprintDetailPage() {
  const { author, name } = useParams()
  const dispatch = useDispatch()
  const bp = useSelector((s) => s.blueprints.current)
  const operation = useSelector((s) => s.blueprints)
  const [points, setPoints] = useState([])
  const canEdit = Boolean(localStorage.getItem('token'))

  useEffect(() => {
    dispatch(fetchBlueprint({ author, name }))
  }, [author, name, dispatch])
  useEffect(() => setPoints(bp?.points || []), [bp])

  if (!bp && operation.errors?.fetchBlueprint)
    return <div className="card" role="alert">{operation.errors.fetchBlueprint} <button className="btn" onClick={() => dispatch(fetchBlueprint({ author, name }))}>Retry</button></div>
  if (!bp)
    return (
      <div className="card">
        <p>Cargando...</p>
      </div>
    )

  return (
    <div className="card">
      <h2 style={{ marginTop: 0 }}>{bp.name}</h2>
      <p>
        <strong>Autor:</strong> {bp.author}
      </p>
      <p>
        <strong>Puntos:</strong> {bp.points?.length || 0}
      </p>
      <BlueprintCanvas points={points} editable={canEdit} onPointsChange={setPoints} />
      {canEdit && <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button className="btn primary" onClick={() => dispatch(updateBlueprint({ ...bp, points }))}>Save</button>
        <button className="btn" onClick={() => dispatch(deleteBlueprint(bp))}>Delete</button>
      </div>}
      {operation.errors?.updateBlueprint && <div role="alert" className="error-banner">{operation.errors.updateBlueprint}</div>}
    </div>
  )
}
