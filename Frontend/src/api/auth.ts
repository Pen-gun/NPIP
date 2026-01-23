import npipClient from './npipClient'
import type { User } from '../types/app'

interface RegisterPayload {
  fullName: string
  username: string
  email: string
  password: string
}

interface LoginPayload {
  identifier: string
  password: string
}

interface ForgotPasswordPayload {
  email: string
}

interface ResetPasswordPayload {
  token: string
  newPassword: string
  confirmPassword: string
}

export const registerUser = async (payload: RegisterPayload) => {
  const response = await npipClient.post('/auth/register', payload)
  return response.data
}

export const loginUser = async (payload: LoginPayload): Promise<User> => {
  const response = await npipClient.post('/auth/login', payload)
  return response.data.data.user
}

export const getCurrentUser = async (): Promise<User> => {
  const response = await npipClient.get('/auth/me')
  return response.data.data
}

export const logoutUser = async (): Promise<void> => {
  await npipClient.post('/auth/logout')
}

export const forgotPassword = async (payload: ForgotPasswordPayload): Promise<string> => {
  const response = await npipClient.post('/auth/forgot-password', payload)
  return response.data.message
}

export const resetPassword = async (payload: ResetPasswordPayload): Promise<string> => {
  const response = await npipClient.post('/auth/reset-password', payload)
  return response.data.message
}
