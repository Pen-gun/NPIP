import { createContext, useCallback, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCurrentUser, loginUser, logoutUser, registerUser } from '../api/auth'
import type { User } from '../../../types/app'

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
const authQueryKey = ['auth', 'me']

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const { data: user, isLoading } = useQuery({
    queryKey: authQueryKey,
    queryFn: getCurrentUser,
    retry: 0,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (loggedInUser) => {
      queryClient.setQueryData(authQueryKey, loggedInUser)
    },
  })

  const registerMutation = useMutation({
    mutationFn: registerUser,
  })

  const logoutMutation = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      queryClient.setQueryData(authQueryKey, null)
      queryClient.invalidateQueries({ queryKey: authQueryKey })
    },
  })

  const login = useCallback(
    async (payload: LoginPayload): Promise<User> => {
      const loggedInUser = await loginMutation.mutateAsync(payload)
      return loggedInUser
    },
    [loginMutation],
  )

  const register = useCallback(
    async (payload: RegisterPayload): Promise<void> => {
      await registerMutation.mutateAsync(payload)
    },
    [registerMutation],
  )

  const logout = useCallback(async (): Promise<void> => {
    await logoutMutation.mutateAsync()
  }, [logoutMutation])

  const refreshUser = useCallback(async (): Promise<void> => {
    await queryClient.invalidateQueries({ queryKey: authQueryKey })
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
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

