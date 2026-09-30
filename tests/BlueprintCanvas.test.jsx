import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import BlueprintCanvas from '../src/components/BlueprintCanvas.jsx'

describe('BlueprintCanvas', () => {
  it('renderiza un canvas y llama getContext', () => {
    const spy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext')
    const { container } = render(
      <BlueprintCanvas
        points={[
          { x: 10, y: 10 },
          { x: 50, y: 60 },
        ]}
      />,
    )
    expect(container.querySelector('canvas')).toBeInTheDocument()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('agrega un punto al hacer click cuando el canvas es editable', () => {
    const onPointsChange = vi.fn()
    const { container } = render(<BlueprintCanvas editable onPointsChange={onPointsChange} />)
    const canvas = container.querySelector('canvas')
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 520, height: 360,
    })
    fireEvent.click(canvas, { clientX: 40, clientY: 80 })
    expect(onPointsChange).toHaveBeenCalledWith([{ x: 40, y: 80 }])
  })

  it('notifica el punto individual con onPointAdd (para enviarlo por tiempo real)', () => {
    const onPointAdd = vi.fn()
    const { container } = render(<BlueprintCanvas editable onPointAdd={onPointAdd} />)
    const canvas = container.querySelector('canvas')
    vi.spyOn(canvas, 'getBoundingClientRect').mockReturnValue({
      left: 10, top: 20, width: 520, height: 360,
    })
    fireEvent.click(canvas, { clientX: 110, clientY: 120 })
    expect(onPointAdd).toHaveBeenCalledWith({ x: 100, y: 100 })
  })

  it('no agrega puntos si no es editable', () => {
    const onPointAdd = vi.fn()
    const { container } = render(<BlueprintCanvas onPointAdd={onPointAdd} />)
    fireEvent.click(container.querySelector('canvas'), { clientX: 5, clientY: 5 })
    expect(onPointAdd).not.toHaveBeenCalled()
  })
})
