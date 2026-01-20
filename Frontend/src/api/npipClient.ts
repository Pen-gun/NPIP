import axios, { isAxiosError } from 'axios'

const npipClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

npipClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Request failed'
      return Promise.reject(new Error(message))
    }
    return Promise.reject(new Error('Request failed'))
  },
)

export default npipClient
