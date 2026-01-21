import npipClient from './npipClient'

export const downloadReport = async (projectId: string) => {
  const response = await npipClient.get(`/reports/${projectId}/pdf`, {
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `project-${projectId}-report.pdf`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}
