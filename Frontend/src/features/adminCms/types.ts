export type PageStatus = 'draft' | 'published'

export type AdminUserSummary = {
  id: string
  name: string
  email: string
}

export type SeoFields = {
  metaTitle: string
  metaDescription: string
  slug: string
  canonical?: string
  ogImage?: string
}

export type MediaItem = {
  id: string
  url: string
  title?: string
  alt?: string
  createdAt: string
}

export type HeroBlock = {
  id: string
  type: 'hero'
  title: string
  subtitle: string
  ctaText: string
  ctaLink: string
  backgroundImage?: string
}

export type RichTextBlock = {
  id: string
  type: 'rich_text'
  content: string
}

export type FeatureGridItem = {
  id: string
  icon: string
  title: string
  description: string
}

export type FeatureGridBlock = {
  id: string
  type: 'feature_grid'
  items: FeatureGridItem[]
}

export type TestimonialItem = {
  id: string
  name: string
  role: string
  photo?: string
  quote: string
}

export type TestimonialsBlock = {
  id: string
  type: 'testimonials'
  items: TestimonialItem[]
}

export type GalleryItem = {
  id: string
  image: string
  caption: string
}

export type GalleryBlock = {
  id: string
  type: 'gallery'
  items: GalleryItem[]
}

export type CtaBandBlock = {
  id: string
  type: 'cta_band'
  text: string
  buttonText: string
  buttonLink: string
}

export type ContentBlock =
  | HeroBlock
  | RichTextBlock
  | FeatureGridBlock
  | TestimonialsBlock
  | GalleryBlock
  | CtaBandBlock

export type AdminPageSummary = {
  id: string
  title: string
  slug: string
  status: PageStatus
  updatedAt: string
  updatedBy?: AdminUserSummary
}

export type AdminPage = AdminPageSummary & {
  seo: SeoFields
  blocks: ContentBlock[]
}

export type PageUpdatePayload = {
  title: string
  slug: string
  status: PageStatus
  seo: SeoFields
  blocks: ContentBlock[]
}

export type MediaUploadPayload = {
  file: File
  title?: string
  alt?: string
}
