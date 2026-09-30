import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit'
import blueprintsService from '../../services/blueprintsService.js'

const errorOf = (action) => action.payload || action.error.message || 'Request failed'
const pending = (s, key) => {
  s.status[key] = 'loading'
  s.errors[key] = null
}
const success = (s, key) => {
  s.status[key] = 'succeeded'
  s.errors[key] = null
}
const failure = (s, key, action) => {
  s.status[key] = 'failed'
  s.errors[key] = errorOf(action)
}

export const fetchAuthors = createAsyncThunk('blueprints/fetchAuthors', async () => {
  const items = await blueprintsService.getAll()
  return [...new Set(items.map((bp) => bp.author))]
})
export const fetchByAuthor = createAsyncThunk('blueprints/fetchByAuthor', async (author) => ({
  author,
  items: await blueprintsService.getByAuthor(author),
}))
export const fetchBlueprint = createAsyncThunk('blueprints/fetchBlueprint', ({ author, name }) =>
  blueprintsService.getByAuthorAndName(author, name),
)
export const createBlueprint = createAsyncThunk('blueprints/createBlueprint', (payload) =>
  blueprintsService.create(payload),
)
export const updateBlueprint = createAsyncThunk('blueprints/updateBlueprint', (payload) =>
  blueprintsService.update(payload),
)
export const deleteBlueprint = createAsyncThunk(
  'blueprints/deleteBlueprint',
  async ({ author, name }) => {
    await blueprintsService.remove(author, name)
    return { author, name }
  },
)

const slice = createSlice({
  name: 'blueprints',
  initialState: {
    authors: [],
    byAuthor: {},
    current: null,
    // Se incrementa solo al (re)cargar un plano desde el servidor; el editor lo usa para
    // resetear el borrador sin pisar los puntos que llegan por tiempo real.
    currentVersion: 0,
    status: {
      fetchAuthors: 'idle',
      fetchByAuthor: 'idle',
      fetchBlueprint: 'idle',
      createBlueprint: 'idle',
      updateBlueprint: 'idle',
      deleteBlueprint: 'idle',
    },
    errors: {},
    rollback: {},
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuthors.pending, (s) => pending(s, 'fetchAuthors'))
      .addCase(fetchAuthors.fulfilled, (s, a) => {
        success(s, 'fetchAuthors')
        s.authors = a.payload
      })
      .addCase(fetchAuthors.rejected, (s, a) => failure(s, 'fetchAuthors', a))
      .addCase(fetchByAuthor.pending, (s) => pending(s, 'fetchByAuthor'))
      .addCase(fetchByAuthor.fulfilled, (s, a) => {
        success(s, 'fetchByAuthor')
        s.byAuthor[a.payload.author] = a.payload.items
      })
      .addCase(fetchByAuthor.rejected, (s, a) => failure(s, 'fetchByAuthor', a))
      .addCase(fetchBlueprint.pending, (s) => pending(s, 'fetchBlueprint'))
      .addCase(fetchBlueprint.fulfilled, (s, a) => {
        success(s, 'fetchBlueprint')
        s.current = a.payload
        s.currentVersion += 1
      })
      .addCase(fetchBlueprint.rejected, (s, a) => failure(s, 'fetchBlueprint', a))
      .addCase(createBlueprint.pending, (s) => pending(s, 'createBlueprint'))
      .addCase(createBlueprint.fulfilled, (s, a) => {
        success(s, 'createBlueprint')
        const bp = a.payload
        s.byAuthor[bp.author] = [...(s.byAuthor[bp.author] || []), bp]
        s.current = bp
      })
      .addCase(createBlueprint.rejected, (s, a) => failure(s, 'createBlueprint', a))
      .addCase(updateBlueprint.pending, (s, a) => {
        pending(s, 'updateBlueprint')
        const bp = a.meta.arg
        s.rollback.update = s.current
        s.current = bp
        if (s.byAuthor[bp.author]) {
          s.byAuthor[bp.author] = s.byAuthor[bp.author].map((item) =>
            item.name === bp.name ? bp : item,
          )
        }
      })
      .addCase(updateBlueprint.fulfilled, (s, a) => {
        success(s, 'updateBlueprint')
        s.current = a.payload
        delete s.rollback.update
      })
      .addCase(updateBlueprint.rejected, (s, a) => {
        failure(s, 'updateBlueprint', a)
        const previous = s.rollback.update
        if (previous) {
          s.current = previous
          if (s.byAuthor[previous.author]) {
            s.byAuthor[previous.author] = s.byAuthor[previous.author].map((item) =>
              item.name === previous.name ? previous : item,
            )
          }
        }
        delete s.rollback.update
      })
      .addCase(deleteBlueprint.pending, (s, a) => {
        pending(s, 'deleteBlueprint')
        const { author, name } = a.meta.arg
        s.rollback.delete = s.byAuthor[author]?.find((bp) => bp.name === name) || s.current
        if (s.byAuthor[author]) s.byAuthor[author] = s.byAuthor[author].filter((bp) => bp.name !== name)
        if (s.current?.author === author && s.current?.name === name) s.current = null
      })
      .addCase(deleteBlueprint.fulfilled, (s) => {
        success(s, 'deleteBlueprint')
        delete s.rollback.delete
      })
      .addCase(deleteBlueprint.rejected, (s, a) => {
        failure(s, 'deleteBlueprint', a)
        const previous = s.rollback.delete
        if (previous) {
          s.byAuthor[previous.author] = [...(s.byAuthor[previous.author] || []), previous]
          s.current = previous
        }
        delete s.rollback.delete
      })
  },
})

export const selectTopFive = createSelector(
  [(state) => state.blueprints.byAuthor],
  (byAuthor) =>
    Object.values(byAuthor)
      .flat()
      .sort((a, b) => (b.points?.length || 0) - (a.points?.length || 0))
      .slice(0, 5),
)
export const selectOperation = (state, key) => ({
  status: state.blueprints.status[key] || 'idle',
  error: state.blueprints.errors[key] || null,
})

export default slice.reducer
