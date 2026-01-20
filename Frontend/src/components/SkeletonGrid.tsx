export default function SkeletonGrid() {
  return (
    <div className='skeleton-grid' aria-live='polite' aria-busy='true'>
      <div className='card skeleton-card'>
        <div className='skeleton-line skeleton-line--short' />
        <div className='skeleton-profile'>
          <div className='skeleton-avatar' />
          <div className='skeleton-block'>
            <div className='skeleton-line' />
            <div className='skeleton-line skeleton-line--medium' />
          </div>
        </div>
        <div className='skeleton-line' />
        <div className='skeleton-line' />
        <div className='skeleton-line skeleton-line--medium' />
      </div>
      <div className='card skeleton-card'>
        <div className='skeleton-line skeleton-line--short' />
        <div className='skeleton-line' />
        <div className='skeleton-line' />
        <div className='skeleton-line skeleton-line--medium' />
      </div>
      <div className='card skeleton-card'>
        <div className='skeleton-line skeleton-line--short' />
        <div className='skeleton-line' />
        <div className='skeleton-line' />
        <div className='skeleton-line skeleton-line--medium' />
      </div>
    </div>
  )
}
