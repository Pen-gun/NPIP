import axios, { isAxiosError } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1'
const REQUEST_TIMEOUT_MS = 15_000
const DEFAULT_ERROR_MESSAGE = 'Request failed'

const extractErrorMessage = (error: unknown): string => {
  if (!isAxiosError(error)) return DEFAULT_ERROR_MESSAGE

  return (
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message ||
    DEFAULT_ERROR_MESSAGE
  )
}

const npipClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  withCredentials: true,
})

npipClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(new Error(extractErrorMessage(error))),
)

export default npipClient
