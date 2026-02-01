import type { ComponentType } from 'react'
import { Facebook, Instagram, Linkedin, Music2, MessageCircle, Twitter } from 'lucide-react'
import { Link } from 'react-router-dom'

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  X: Twitter,
  Twitter,
  LinkedIn: Linkedin,
  Facebook,
  Instagram,
  Threads: MessageCircle,
  TikTok: Music2,
}

export type FooterLink = {
  title: string
  href: string
}

export type SocialLink = {
  label: string
  href: string
}

export default function FooterSection({
  links,
  socialLinks,
  brandName,
}: {
  links: FooterLink[]
  socialLinks: SocialLink[]
  brandName: string
}) {
  return (
    <footer className='bg-(--surface-muted) py-16'>
      <div className='mx-auto max-w-5xl px-6'>
        <Link to='/' aria-label='go home' className='mx-auto block w-fit text-sm font-semibold'>
          {brandName}
        </Link>

        <div className='my-8 flex flex-wrap justify-center gap-6'>
          {links.map((link, index) => (
            <Link
              key={`${link.title}-${index}`}
              to={link.href}
              className='block text-(--text-muted) transition duration-150 hover:text-(--brand-accent)'
            >
              <span>{link.title}</span>
            </Link>
          ))}
        </div>
        <div className='my-8 flex flex-wrap justify-center gap-6 text-sm'>
          {socialLinks.map((link, index) => {
            const Icon = iconMap[link.label] || Twitter
            return (
              <a
                key={`${link.label}-${index}`}
                href={link.href}
                target='_blank'
                rel='noopener noreferrer'
                aria-label={link.label}
                className='block text-(--text-muted) hover:text-(--brand-accent)'
              >
                <Icon className='h-6 w-6' />
              </a>
            )
          })}
        </div>
        <span className='block text-center text-sm text-(--text-muted)'>
          © {new Date().getFullYear()} {brandName}, All rights reserved
        </span>
      </div>
    </footer>
  )
}
