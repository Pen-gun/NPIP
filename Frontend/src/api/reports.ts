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
export type ReportFormat = 'pdf' | 'csv' | 'excel'

export const downloadReport = async (
  projectId: string, 
  scope: ReportScope = 'summary',
  format: ReportFormat = 'pdf'
): Promise<void> => {
  const endpoint = format === 'pdf' 
    ? `/reports/${projectId}/pdf`
    : format === 'csv'
      ? `/reports/${projectId}/csv`
      : `/reports/${projectId}/excel`
  
  const mimeType = format === 'pdf' 
    ? 'application/pdf'
    : format === 'csv'
      ? 'text/csv'
      : 'application/vnd.ms-excel'
  
  const extension = format === 'pdf' ? 'pdf' : format === 'csv' ? 'csv' : 'xls'

  const response = await npipClient.get(endpoint, {
    params: { scope },
    responseType: 'blob',
  })
  const blob = new Blob([response.data], { type: mimeType })
  createDownloadLink(blob, `project-${projectId}-${scope}-report.${extension}`)
}
