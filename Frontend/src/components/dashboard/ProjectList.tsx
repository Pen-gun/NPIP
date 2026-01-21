import type { Project } from '../../types/app'

interface ProjectListProps {
  projects: Project[]
  activeProjectId: string
  activeProject: Project | null
  loading: boolean
  onSelectProject: (projectId: string) => void
  onRunIngestion: () => void
  onDownloadReport: () => void
  onDeleteProject: (projectId: string) => void
}

const SKELETON_COUNT = 3

export default function ProjectList({
  projects,
  activeProjectId,
  activeProject,
  loading,
  onSelectProject,
  onRunIngestion,
  onDownloadReport,
  onDeleteProject,
}: ProjectListProps) {
  return (
    <div className='rounded-[28px] border border-(--border) bg-(--surface-base) p-6 shadow-(--shadow)'>
      <h2 className='text-lg font-semibold'>Projects</h2>
      <p className='text-sm text-(--text-muted)'>Select a project to monitor.</p>
      <div className='mt-4 flex flex-wrap gap-2'>
        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div
              key={`project-skeleton-${index}`}
              className='h-8 w-24 rounded-full bg-(--surface-muted) animate-pulse'
            />
          ))}
        {!loading &&
          projects.map((project) => (
            <button
              key={project._id}
              onClick={() => onSelectProject(project._id)}
              className={`rounded-full px-4 py-2 text-xs font-semibold ${
                activeProjectId === project._id
                  ? 'bg-(--brand-primary) text-(--text-inverse)'
                  : 'border border-(--border)'
              }`}
            >
              {project.name}
            </button>
          ))}
      </div>
      {activeProject && (
        <div className='mt-4 flex flex-wrap items-center gap-3 text-sm text-(--text-muted)'>
          <span>Keywords: {activeProject.keywords.join(', ') || 'None'}</span>
          <span>Schedule: {activeProject.scheduleMinutes} min</span>
          <button
            className='rounded-full border border-(--border) px-3 py-1 text-xs font-semibold'
            onClick={onRunIngestion}
            type='button'
          >
            Run now
          </button>
          <button
            className='rounded-full border border-(--border) px-3 py-1 text-xs font-semibold'
            onClick={onDownloadReport}
            type='button'
          >
            Download PDF
          </button>
          <button
            className='rounded-full border border-(--border) px-3 py-1 text-xs font-semibold text-(--state-error)'
            onClick={() => onDeleteProject(activeProject._id)}
            type='button'
          >
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
