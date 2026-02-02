import type { AdminPage, ContentBlock } from './types'
import type { PageFormValues } from './schemas'

export const blockLabels: Record<ContentBlock['type'], string> = {
  hero: 'Hero',
  rich_text: 'Rich text',
  feature_grid: 'Feature grid',
  testimonials: 'Testimonials',
  gallery: 'Gallery',
  cta_band: 'CTA band',
}

export const blockDescriptions: Record<ContentBlock['type'], string> = {
  hero: 'Primary headline, subtitle, CTA, and background visual.',
  rich_text: 'Flexible body copy with headings, lists, and links.',
  feature_grid: 'Grid of value props with icons and descriptions.',
  testimonials: 'Quotes from customers or partners.',
  gallery: 'Visual gallery with captions.',
  cta_band: 'Bold call-to-action strip.',
}

export const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const formatDateTime = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString()
}

export const buildPageDefaults = (page?: AdminPage | null): PageFormValues => ({
  title: page?.title ?? '',
  slug: page?.slug ?? '',
  status: page?.status ?? 'draft',
  seo: {
    metaTitle: page?.seo?.metaTitle ?? '',
    metaDescription: page?.seo?.metaDescription ?? '',
    slug: page?.seo?.slug ?? page?.slug ?? '',
    canonical: page?.seo?.canonical ?? '',
    ogImage: page?.seo?.ogImage ?? '',
  },
  blocks: page?.blocks ?? [
    {
      id: createId(),
      type: 'hero',
      title: '',
      subtitle: '',
      ctaText: '',
      ctaLink: '',
      backgroundImage: '',
    },
  ],
})

export const createBlockDefaults = (type: ContentBlock['type']): ContentBlock => {
  switch (type) {
    case 'hero':
      return {
        id: createId(),
        type: 'hero',
        title: 'New hero headline',
        subtitle: 'Add supporting copy that explains the value.',
        ctaText: 'Get started',
        ctaLink: '/contact',
        backgroundImage: '',
      }
    case 'rich_text':
      return {
        id: createId(),
        type: 'rich_text',
        content: '### New section\n\nAdd your copy here.',
      }
    case 'feature_grid':
      return {
        id: createId(),
        type: 'feature_grid',
        items: [
          {
            id: createId(),
            icon: 'Sparkles',
            title: 'Feature title',
            description: 'Describe the outcome for your users.',
          },
        ],
      }
    case 'testimonials':
      return {
        id: createId(),
        type: 'testimonials',
        items: [
          {
            id: createId(),
            name: 'Customer name',
            role: 'Role or company',
            photo: '',
            quote: 'Short testimonial about the impact.',
          },
        ],
      }
    case 'gallery':
      return {
        id: createId(),
        type: 'gallery',
        items: [
          {
            id: createId(),
            image: '',
            caption: 'Describe what the image shows.',
          },
        ],
      }
    case 'cta_band':
      return {
        id: createId(),
        type: 'cta_band',
        text: 'Ready to start?',
        buttonText: 'Request demo',
        buttonLink: '/contact',
      }
    default:
      return {
        id: createId(),
        type: 'rich_text',
        content: '',
      }
  }
}
