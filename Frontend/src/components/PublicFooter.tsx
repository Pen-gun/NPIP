import { Link } from 'react-router-dom'
import type { PublicPageSummary } from '../api/pages'

const LINK_SLUGS = new Set(['about', 'contact', 'faq', 'privacy', 'terms'])

export default function PublicFooter({ pages }: { pages: PublicPageSummary[] }) {
  const links = pages.filter((page) => LINK_SLUGS.has(page.slug))

  if (!links.length) return null

  return (
    <footer className='mt-12 border-t border-(--border) bg-(--surface-background)'>
      <div className='mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs font-semibold uppercase tracking-[0.2em] text-(--text-muted) sm:px-6'>
        <span>NPIP</span>
        <div className='flex flex-wrap gap-4'>
          {links.map((link) => (
            <Link key={link.slug} to={`/${link.slug}`} className='transition hover:text-(--text-primary)'>
              {link.title}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
