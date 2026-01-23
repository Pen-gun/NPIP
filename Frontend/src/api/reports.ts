import npipClient from './npipClient'

const createDownloadLink = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.URL.revokeObjectURL(url)
}

export type ReportScope = 'summary' | 'all' | 'mentions' | 'last_run'

export const downloadReport = async (projectId: string, scope: ReportScope = 'summary'): Promise<void> => {
  const response = await npipClient.get(`/reports/${projectId}/pdf`, {
    params: { scope },
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: 'application/pdf' })
  createDownloadLink(blob, `project-${projectId}-${scope}-report.pdf`)
}
