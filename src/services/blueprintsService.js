import apiclient from './apiClient.js'
import apimock from './apimock.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'

export default useMock ? apimock : apiclient
