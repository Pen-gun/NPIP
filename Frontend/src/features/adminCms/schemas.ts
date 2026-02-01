import { z } from 'zod'

const heroBlockSchema = z.object({
  id: z.string(),
  type: z.literal('hero'),
  title: z.string().min(1, 'Hero title is required'),
  subtitle: z.string().min(1, 'Hero subtitle is required'),
  ctaText: z.string().min(1, 'CTA text is required'),
  ctaLink: z.string().min(1, 'CTA link is required'),
  backgroundImage: z.string().optional(),
})

const richTextBlockSchema = z.object({
  id: z.string(),
  type: z.literal('rich_text'),
  content: z.string().min(1, 'Rich text content is required'),
})

const featureGridBlockSchema = z.object({
  id: z.string(),
  type: z.literal('feature_grid'),
  items: z
    .array(
      z.object({
        id: z.string(),
        icon: z.string().min(1, 'Icon is required'),
        title: z.string().min(1, 'Title is required'),
        description: z.string().min(1, 'Description is required'),
      }),
    )
    .min(1, 'Add at least one feature'),
})

const testimonialsBlockSchema = z.object({
  id: z.string(),
  type: z.literal('testimonials'),
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().min(1, 'Name is required'),
        role: z.string().min(1, 'Role is required'),
        photo: z.string().optional(),
        quote: z.string().min(1, 'Quote is required'),
      }),
    )
    .min(1, 'Add at least one testimonial'),
})

const galleryBlockSchema = z.object({
  id: z.string(),
  type: z.literal('gallery'),
  items: z
    .array(
      z.object({
        id: z.string(),
        image: z.string().min(1, 'Image URL is required'),
        caption: z.string().min(1, 'Caption is required'),
      }),
    )
    .min(1, 'Add at least one gallery image'),
})

const ctaBandBlockSchema = z.object({
  id: z.string(),
  type: z.literal('cta_band'),
  text: z.string().min(1, 'CTA text is required'),
  buttonText: z.string().min(1, 'Button text is required'),
  buttonLink: z.string().min(1, 'Button link is required'),
})

export const contentBlockSchema = z.discriminatedUnion('type', [
  heroBlockSchema,
  richTextBlockSchema,
  featureGridBlockSchema,
  testimonialsBlockSchema,
  galleryBlockSchema,
  ctaBandBlockSchema,
])

export const seoSchema = z.object({
  metaTitle: z.string().min(1, 'Meta title is required'),
  metaDescription: z.string().min(1, 'Meta description is required'),
  slug: z.string().min(1, 'Slug is required'),
  canonical: z.string().optional(),
  ogImage: z.string().optional(),
})

export const pageFormSchema = z.object({
  title: z.string().min(1, 'Page title is required'),
  slug: z.string().min(1, 'Slug is required'),
  status: z.enum(['draft', 'published']),
  seo: seoSchema,
  blocks: z.array(contentBlockSchema).min(1, 'Add at least one content block'),
})

export type PageFormValues = z.infer<typeof pageFormSchema>
