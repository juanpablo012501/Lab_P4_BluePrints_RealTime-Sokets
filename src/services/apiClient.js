import api from './httpClient.js'

const apiclient = {
  async getAll() {
    const { data } = await api.get('/api/v1/blueprints')
    return data.data
  },

  async getByAuthor(author) {
    const { data } = await api.get(`/api/v1/blueprints/${encodeURIComponent(author)}`)
    return data.data
  },

  async getByAuthorAndName(author, name) {
    const { data } = await api.get(
      `/api/v1/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
    )
    return data.data
  },

  async create(blueprint) {
    const { data } = await api.post('/api/v1/blueprints', blueprint)
    return data.data
  },
  async update({ author, name, points }) {
    const { data } = await api.put(
      `/api/v1/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`,
      { author, name, points },
    )
    return data.data
  },
  async remove(author, name) {
    await api.delete(`/api/v1/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`)
  },
}

export default apiclient
