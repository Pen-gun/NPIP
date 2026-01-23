import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../api/auth'
import type { User } from '../types/app'

interface LoginPayload {
  identifier: string
  password: string
}

interface RegisterPayload {
  fullName: string
  username: string
  email: string
  password: string
}

interface AuthContextValue {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (payload: LoginPayload): Promise<User> => {
    const loggedInUser = await loginUser(payload)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const register = useCallback(async (payload: RegisterPayload): Promise<void> => {
    await registerUser(payload)
  }, [])

  const logout = useCallback(async (): Promise<void> => {
    await logoutUser()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async (): Promise<void> => {
    await checkAuth()
  }, [checkAuth])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, isLoading, login, register, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
