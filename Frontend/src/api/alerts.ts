import npipClient from './npipClient'
import type { AlertItem } from '../types/app'

export const fetchAlerts = async (): Promise<AlertItem[]> => {
  const response = await npipClient.get('/alerts')
  return response.data.data
}

export const markAlertRead = async (alertId: string): Promise<AlertItem> => {
  const response = await npipClient.patch(`/alerts/${alertId}/read`)
  return response.data.data
}
