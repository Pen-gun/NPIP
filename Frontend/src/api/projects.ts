import npipClient from './npipClient'
import type { ConnectorHealth, Project, ProjectMetrics } from '../types/app'

interface CreateProjectPayload {
  name: string
  keywords: string[]
  booleanQuery: string
  scheduleMinutes: number
  geoFocus: string
  sources: Record<string, boolean>
}

export const listProjects = async (): Promise<Project[]> => {
  const response = await npipClient.get('/projects')
  return response.data.data
}

export const createProject = async (payload: CreateProjectPayload): Promise<Project> => {
  const response = await npipClient.post('/projects', payload)
  return response.data.data
}

export const deleteProject = async (projectId: string): Promise<void> => {
  await npipClient.delete(`/projects/${projectId}`)
}

export const fetchProjectMetrics = async (
  projectId: string,
  from?: string,
  to?: string,
): Promise<ProjectMetrics> => {
  const response = await npipClient.get(`/projects/${projectId}/metrics`, {
    params: { from, to },
  })
  return response.data.data
}

export const fetchProjectHealth = async (projectId: string): Promise<ConnectorHealth[]> => {
  const response = await npipClient.get(`/projects/${projectId}/health`)
  return response.data.data
}

export const runProjectIngestion = async (projectId: string) => {
  const response = await npipClient.post(`/projects/${projectId}/run`)
  return response.data.data
}

export const updateProjectStatus = async (
  projectId: string,
  status: 'active' | 'paused',
): Promise<Project> => {
  const response = await npipClient.patch(`/projects/${projectId}`, { status })
  return response.data.data
}
