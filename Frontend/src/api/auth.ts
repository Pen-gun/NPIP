import npipClient from './npipClient'
import type { User } from '../types/app'

export const registerUser = async (payload: {
  fullName: string
  username: string
  email: string
  password: string
}) => {
  const response = await npipClient.post('/auth/register', payload)
  return response.data
}

export const loginUser = async (payload: {
  username?: string
  email?: string
  password: string
}): Promise<User> => {
  const response = await npipClient.post('/auth/login', payload)
  return response.data.data.user
}

export const getCurrentUser = async (): Promise<User> => {
  const response = await npipClient.get('/auth/me')
  return response.data.data
}

export const logoutUser = async () => {
  await npipClient.post('/auth/logout')
}
