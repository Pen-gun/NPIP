import { useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import type { AlertItem } from '../types/app'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined

interface UseDashboardSocketParams {
  userId?: string
  activeProjectId: string
  onAlert: (alert: AlertItem) => void
}

export function useDashboardSocket({ userId, activeProjectId, onAlert }: UseDashboardSocketParams) {
  const socketRef = useRef<Socket | null>(null)
  const [socketConnected, setSocketConnected] = useState(false)

  useEffect(() => {
    if (!userId) {
      socketRef.current?.disconnect()
      socketRef.current = null
      return
    }
    const socket: Socket = io(SOCKET_URL || window.location.origin, {
      withCredentials: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setSocketConnected(true)
    })

    socket.on('disconnect', () => {
      setSocketConnected(false)
    })

    socket.on('connect_error', () => {
      setSocketConnected(false)
    })

    socket.on('alert', onAlert)

    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('alert', onAlert)
      socket.disconnect()
      socketRef.current = null
    }
  }, [userId, onAlert])

  useEffect(() => {
    if (!userId || !activeProjectId) return
    const socket = socketRef.current
    if (!socket) return
    if (socket.connected) {
      socket.emit('join', { userId, projectId: activeProjectId })
      return
    }
    const handleConnect = () => {
      socket.emit('join', { userId, projectId: activeProjectId })
    }
    socket.on('connect', handleConnect)
    return () => {
      socket.off('connect', handleConnect)
    }
  }, [userId, activeProjectId])

  return { socketConnected }
}
