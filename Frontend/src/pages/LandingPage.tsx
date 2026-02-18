import LandingContent from '../components/landing/LandingContent'
import LandingErrorState from '../components/landing/LandingErrorState'
import { useHomePageContent } from '../hooks/useHomePageContent'

export default function LandingPage() {
  const { homeError, heroBlock, highlights, workflowSteps, constraints, dataSources, ctaBlock } =
    useHomePageContent()

  if (homeError) {
    const status =
      typeof homeError === 'object' && homeError !== null && 'response' in homeError
        ? (homeError as { response?: { status?: number } }).response?.status
        : undefined

    return <LandingErrorState status={status} />
  }

  return (
    <LandingContent
      heroBlock={heroBlock}
      highlights={highlights}
      workflowSteps={workflowSteps}
      constraints={constraints}
      dataSources={dataSources}
      ctaBlock={ctaBlock}
    />
  )
}
