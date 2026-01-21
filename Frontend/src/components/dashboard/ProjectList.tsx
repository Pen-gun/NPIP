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
const ACTION_BTN_CLASS = 'rounded-full border border-(--border) px-3 py-1.5 text-xs font-semibold transition hover:bg-(--surface-muted) active:scale-95'

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
    <div className='rounded-[20px] border border-(--border) bg-(--surface-base) p-4 shadow-(--shadow) sm:rounded-[28px] sm:p-6'>
      <h2 className='text-base font-semibold sm:text-lg'>Projects</h2>
      <p className='text-xs text-(--text-muted) sm:text-sm'>Select a project to monitor.</p>
      <div className='mt-3 flex flex-wrap gap-2 sm:mt-4'>
        {loading &&
          Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <div
              key={`project-skeleton-${index}`}
              className='h-8 w-20 rounded-full bg-(--surface-muted) animate-pulse sm:w-24'
            />
          ))}
        {!loading &&
          projects.map((project) => (
            <button
              key={project._id}
              onClick={() => onSelectProject(project._id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 ${
                activeProjectId === project._id
                  ? 'bg-(--brand-primary) text-(--text-inverse)'
                  : 'border border-(--border) hover:bg-(--surface-muted)'
              }`}
            >
              {project.name}
            </button>
          ))}
      </div>
      {activeProject && (
        <div className='mt-3 space-y-2 sm:mt-4 sm:space-y-0'>
          <div className='flex flex-wrap items-center gap-2 text-xs text-(--text-muted) sm:gap-3 sm:text-sm'>
            <span className='w-full sm:w-auto'>Keywords: {activeProject.keywords.join(', ') || 'None'}</span>
            <span>Schedule: {activeProject.scheduleMinutes} min</span>
          </div>
          <div className='flex flex-wrap gap-2 pt-2'>
            <button className={ACTION_BTN_CLASS} onClick={onRunIngestion} type='button'>
              Run now
            </button>
            <button className={ACTION_BTN_CLASS} onClick={onDownloadReport} type='button'>
              Download PDF
            </button>
            <button
              className={`${ACTION_BTN_CLASS} text-(--state-error)`}
              onClick={() => onDeleteProject(activeProject._id)}
              type='button'
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
