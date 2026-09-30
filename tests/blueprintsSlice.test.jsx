import { describe, it, expect } from 'vitest'
import reducer, { fetchBlueprint, updateBlueprint, fetchByAuthor, selectTopFive } from '../src/features/blueprints/blueprintsSlice.js'

describe('blueprints slice', () => {
  it('should initialize correctly', () => {
    const state = reducer(undefined, { type: '@@INIT' })
    expect(state.authors).toEqual([])
    expect(state.status.fetchByAuthor).toBe('idle')
  })

  it('updates author results with a fulfilled thunk action', () => {
    const state = reducer(undefined, {
      type: fetchByAuthor.fulfilled.type,
      payload: { author: 'john', items: [{ author: 'john', name: 'house', points: [] }] },
    })
    expect(state.byAuthor.john).toHaveLength(1)
    expect(state.status.fetchByAuthor).toBe('succeeded')
  })

  it('returns a memoized top-five ranking', () => {
    const state = { blueprints: { byAuthor: {
      john: [{ author: 'john', name: 'a', points: [{ x: 1, y: 1 }] }],
      jane: [{ author: 'jane', name: 'b', points: Array(6).fill({ x: 1, y: 1 }) }],
    } } }
    expect(selectTopFive(state)[0].name).toBe('b')
    expect(selectTopFive(state)).toBe(selectTopFive(state))
  })

  it('currentVersion solo aumenta al recargar el plano, no al guardarlo', () => {
    const bp = { author: 'john', name: 'house', points: [{ x: 1, y: 1 }] }
    let state = reducer(undefined, { type: fetchBlueprint.fulfilled.type, payload: bp })
    expect(state.currentVersion).toBe(1)
    state = reducer(state, { type: updateBlueprint.fulfilled.type, payload: bp })
    expect(state.currentVersion).toBe(1)
  })
})
