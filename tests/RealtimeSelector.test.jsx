import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RealtimeSelector from '../src/components/RealtimeSelector.jsx'

describe('RealtimeSelector', () => {
  it('ofrece None / Socket.IO / STOMP y avisa el cambio', () => {
    const onChange = vi.fn()
    render(<RealtimeSelector tech="none" onChange={onChange} />)
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'None',
      'Socket.IO',
      'STOMP',
    ])
    fireEvent.change(screen.getByLabelText(/Tiempo real/i), { target: { value: 'stomp' } })
    expect(onChange).toHaveBeenCalledWith('stomp')
  })

  it('muestra estado y error de la conexión', () => {
    render(<RealtimeSelector tech="socketio" onChange={() => {}} status="error" error="Sin conexión" />)
    expect(screen.getByTestId('rt-status')).toHaveTextContent('Error')
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión')
  })
})
