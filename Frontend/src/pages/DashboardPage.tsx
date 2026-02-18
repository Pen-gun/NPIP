import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import MetricsCharts from '../components/dashboard/MetricsCharts'
import MentionsList from '../components/dashboard/MentionsList'
import AnalysisView from '../components/dashboard/AnalysisView'
import DashboardTopBar from '../components/dashboard/DashboardTopBar'
import DashboardSidebar from '../components/dashboard/DashboardSidebar'
import DashboardRightPanel from '../components/dashboard/DashboardRightPanel'
import ProjectDetailsPanel from '../components/dashboard/ProjectDetailsPanel'
import ProjectModal from '../components/dashboard/ProjectModal'
import DashboardFigureSourceProbe from '../components/dashboard/DashboardFigureSourceProbe'
import DashboardOnboardingGuide from '../components/dashboard/DashboardOnboardingGuide'
import { SOURCE_LABELS } from '../components/dashboard/dashboardUtils'
import DashboardStatusBanners from '../components/dashboard/DashboardStatusBanners'
import DashboardMobileControls from '../components/dashboard/DashboardMobileControls'
import DashboardReportsSection from '../components/dashboard/DashboardReportsSection'
import { useDashboardSocket } from '../hooks/useDashboardSocket'
import { useDashboardData } from '../hooks/useDashboardData'

type DashboardMode = 'overview' | 'mentions' | 'analytics' | 'reports' | 'sources'

interface DashboardPageProps {
  mode?: DashboardMode
}

export default function DashboardPage({ mode = 'overview' }: DashboardPageProps) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const {
    projects,
    activeProjectId,
    setActiveProjectId,
    activeProject,
    metrics,
    mentions,
    health,
    loadingDashboard,
    loadingPanels,
    loadingMore,
    loadingProjects,
    actionLoading,
    error,
    setError,
    projectForm,
    setProjectForm,
    showProjectModal,
    setShowProjectModal,
    pagination,
    filteredAlerts,
    pushSocketAlert,
    handleProjectSubmit,
    handleRunIngestion,
    handleToggleProjectStatus,
    handleDownloadReport,
    handleDeleteProject,
    handleMarkAlertRead,
    handleLoadMoreMentions,
    mentionSearch,
    setMentionSearch,
    chartGranularity,
    setChartGranularity,
    dateRange,
    sourceFilters,
    sentimentFilters,
    sortOrder,
    setSortOrder,
    setCurrentPage,
    mentionsBySource,
    filteredMentions,
    appliedFilters,
    handleDateRangeChange,
    handleSourceFilterToggle,
    handleSentimentToggle,
    handleSaveFilters,
    handleClearFilters,
  } = useDashboardData({ user })

  const { socketConnected } = useDashboardSocket({
    userId: user?._id,
    activeProjectId,
    onAlert: pushSocketAlert,
  })

  return (
    <div className='dashboard-shell min-h-screen bg-(--surface-background) text-(--text-primary)'>
      <DashboardStatusBanners
        error={error}
        showSocketWarning={!socketConnected && !!user}
        onDismissError={() => setError(null)}
      />

      {(mode === 'overview' || mode === 'mentions' || mode === 'analytics') && (
        <DashboardTopBar
          mentionSearch={mentionSearch}
          onMentionSearchChange={setMentionSearch}
          appliedFilters={appliedFilters}
          mentionsBySource={mentionsBySource}
          sourceFilters={sourceFilters}
          sourceLabels={SOURCE_LABELS}
          onSourceFilterToggle={handleSourceFilterToggle}
          sentimentFilters={sentimentFilters}
          onSentimentToggle={handleSentimentToggle}
          onClearFilters={handleClearFilters}
          onSaveFilters={handleSaveFilters}
        />
      )}

      <DashboardMobileControls
        mode={mode}
        projects={projects}
        activeProjectId={activeProjectId}
        activeProject={activeProject}
        loadingProjects={loadingProjects}
        actionLoading={actionLoading}
        socketConnected={socketConnected}
        onSelectProject={setActiveProjectId}
        onRunIngestion={handleRunIngestion}
        onDownloadReport={(scope) => {
          void handleDownloadReport(scope, 'pdf')
        }}
        onToggleStatus={handleToggleProjectStatus}
        onDeleteProject={handleDeleteProject}
        onCreateProject={() => setShowProjectModal(true)}
        onNavigate={navigate}
      />

      <div className='mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8'>
        <div className='grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-0'>
          <DashboardSidebar
            projects={projects}
            activeProjectId={activeProjectId}
            activeProject={activeProject}
            loadingProjects={loadingProjects}
            actionLoading={actionLoading}
            socketConnected={socketConnected}
            mode={mode}
            mentionsTotal={pagination?.totalCount}
            onSelectProject={setActiveProjectId}
            onRunIngestion={handleRunIngestion}
            onDownloadReport={handleDownloadReport}
            onToggleStatus={handleToggleProjectStatus}
            onDeleteProject={handleDeleteProject}
            onCreateProject={() => setShowProjectModal(true)}
            className='order-2 lg:order-1'
          />

          <main className='order-1 min-w-0 bg-(--surface-background) px-0 py-0 sm:px-4 sm:py-4 lg:order-2 lg:px-8 lg:py-6'>
            <div
              className={`grid min-w-0 gap-6 ${
                mode === 'overview' || mode === 'mentions' || mode === 'analytics'
                  ? 'xl:grid-cols-[minmax(0,1fr)_320px]'
                  : ''
              }`}
            >
              <div className='min-w-0 space-y-6'>
                {(mode === 'overview' ||
                  mode === 'mentions' ||
                  mode === 'analytics' ||
                  mode === 'reports') && (
                  <ProjectDetailsPanel
                    activeProject={activeProject}
                    actionLoading={actionLoading}
                    socketConnected={socketConnected}
                    onRunIngestion={handleRunIngestion}
                    onDownloadReport={(scope) => {
                      void handleDownloadReport(scope, 'pdf')
                    }}
                    onToggleStatus={handleToggleProjectStatus}
                    onDeleteProject={handleDeleteProject}
                  />
                )}

                {(mode === 'overview' || mode === 'analytics') && (
                  <section className='rounded-2xl border border-(--border) bg-(--surface-base) p-4 shadow-sm sm:p-6'>
                    <div className='flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-(--text-muted)'>
                      <span>Volume analysis</span>
                      <div className='flex items-center gap-2'>
                        {(['days', 'weeks', 'months'] as const).map((item) => (
                          <button
                            key={item}
                            type='button'
                            onClick={() => setChartGranularity(item)}
                            className={`rounded-full border px-3 py-1 ${
                              chartGranularity === item
                                ? 'border-(--brand-accent) text-(--brand-accent)'
                                : 'border-(--border) text-(--text-muted)'
                            }`}
                          >
                            {item.charAt(0).toUpperCase() + item.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <MetricsCharts
                      metrics={metrics}
                      loading={loadingDashboard}
                      granularity={chartGranularity}
                    />
                  </section>
                )}

                {mode === 'mentions' && (
                  <MentionsList
                    mentions={filteredMentions}
                    loading={loadingDashboard}
                    pagination={pagination ?? undefined}
                    sortOrder={sortOrder}
                    onSortChange={(sort) => {
                      setSortOrder(sort)
                      setCurrentPage(1)
                    }}
                    onLoadMore={handleLoadMoreMentions}
                    loadingMore={loadingMore}
                  />
                )}

                {mode === 'analytics' && <AnalysisView mentions={mentions} loading={loadingDashboard} />}

                {mode === 'reports' && (
                  <DashboardReportsSection
                    activeProjectId={activeProjectId}
                    actionLoading={actionLoading}
                    onDownloadReport={(scope) => {
                      void handleDownloadReport(scope, 'pdf')
                    }}
                  />
                )}

                {mode === 'sources' && <DashboardFigureSourceProbe activeProject={activeProject} />}
              </div>

              {(mode === 'overview' || mode === 'mentions' || mode === 'analytics') && (
                <div className='min-w-0 space-y-6'>
                  <DashboardRightPanel
                    dateRange={dateRange}
                    onDateRangeChange={handleDateRangeChange}
                    mentionsCount={pagination?.totalCount ?? mentions.length}
                    mentionsBySource={mentionsBySource}
                    sourceFilters={sourceFilters}
                    sourceLabels={SOURCE_LABELS}
                    onSourceFilterToggle={handleSourceFilterToggle}
                    sentimentFilters={sentimentFilters}
                    onSentimentToggle={handleSentimentToggle}
                    alerts={filteredAlerts}
                    health={health}
                    loading={loadingPanels}
                    onMarkAlertRead={handleMarkAlertRead}
                  />
                </div>
              )}
            </div>
          </main>
        </div>
      </div>

      <ProjectModal
        isOpen={showProjectModal}
        formState={projectForm}
        submitting={actionLoading === 'create'}
        onClose={() => setShowProjectModal(false)}
        onFormChange={setProjectForm}
        onSubmit={(event) => {
          void handleProjectSubmit(event).then((wasCreated) => {
            if (wasCreated) {
              setShowProjectModal(false)
            }
          })
        }}
      />

      <DashboardOnboardingGuide userId={user?._id} />
    </div>
  )
}
