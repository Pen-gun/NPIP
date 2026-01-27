import type { FormEvent } from 'react'
import X from 'lucide-react/dist/esm/icons/x'
import ProjectForm from './ProjectForm'
import type { ProjectFormState } from './ProjectForm'

interface ProjectModalProps {
  isOpen: boolean
  formState: ProjectFormState
  submitting?: boolean
  onClose: () => void
  onFormChange: (updater: (prev: ProjectFormState) => ProjectFormState) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export default function ProjectModal({
  isOpen,
  formState,
  submitting,
  onClose,
  onFormChange,
  onSubmit,
}: ProjectModalProps) {
  if (!isOpen) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-(--border) bg-(--surface-base) p-6 shadow-xl'>
        <button
          onClick={onClose}
          className='absolute right-4 top-4 rounded-lg p-1 text-(--text-muted) hover:bg-(--surface-muted) hover:text-(--text-base)'
        >
          <X className='h-5 w-5' />
        </button>
        <h2 className='mb-4 text-lg font-semibold'>Create New Project</h2>
        <ProjectForm
          formState={formState}
          onFormChange={onFormChange}
          onSubmit={onSubmit}
          submitting={submitting}
        />
      </div>
    </div>
  )
}
