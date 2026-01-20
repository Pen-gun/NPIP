import axios from 'axios'

const npipClient = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

export default npipClient
