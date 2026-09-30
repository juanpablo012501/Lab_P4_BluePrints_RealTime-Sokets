import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import BlueprintForm from '../components/BlueprintForm.jsx'
import BlueprintCanvas from '../components/BlueprintCanvas.jsx'
import { createBlueprint } from '../features/blueprints/blueprintsSlice.js'
import { useState } from 'react'

export default function BlueprintEditorPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { current, errors = {}, status = {} } = useSelector((s) => s.blueprints)
  const [points, setPoints] = useState([])
  const submit = (blueprint) =>
    dispatch(createBlueprint({ ...blueprint, points: points.length ? points : blueprint.points }))
      .unwrap()
      .then(() => navigate('/'))
  return (
    <div className="grid" style={{ gap: 16 }}>
      <BlueprintForm onSubmit={submit} />
      <div className="card">
        <h3>Canvas</h3>
        <BlueprintCanvas points={points} editable onPointsChange={setPoints} />
        {status.createBlueprint === 'loading' && <p>Saving...</p>}
        {errors.createBlueprint && <div role="alert" className="error-banner">{errors.createBlueprint}</div>}
      </div>
      {current && <p>Created {current.name}</p>}
    </div>
  )
}
