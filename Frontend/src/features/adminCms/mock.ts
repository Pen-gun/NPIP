import type { AdminPage, AdminPageSummary, MediaItem } from './types'

const now = new Date().toISOString()

export const mockAdminPages: AdminPage[] = [
  {
    id: 'page-home',
    title: 'Home',
    slug: 'home',
    status: 'published',
    updatedAt: now,
    updatedBy: { id: 'user-1', name: 'Avery Patel', email: 'avery@npip.ai' },
    seo: {
      metaTitle: 'NPIP | Real-time Public Insight Platform',
      metaDescription:
        'Track public sentiment, real-time mentions, and reputation intelligence across global sources.',
      slug: 'home',
      canonical: 'https://npip.ai/',
      ogImage: 'https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?q=80&w=1600',
    },
    blocks: [
      {
        id: 'block-hero',
        type: 'hero',
        title: 'Real-time public insight that moves faster than the news cycle.',
        subtitle:
          'Capture emerging narratives, map sentiment, and turn signals into executive decisions across every channel.',
        ctaText: 'Book a strategy demo',
        ctaLink: '/contact',
        backgroundImage: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1600',
      },
      {
        id: 'block-rich',
        type: 'rich_text',
        content:
          '### Intelligence that stays on top of the conversation\n\n- **Real-time ingestion** across news, social, and forums.\n- **AI-driven analysis** for sentiment, topics, and influence.\n- **Actionable reporting** delivered to stakeholders in minutes.\n\n[Explore how it works](/features)',
      },
      {
        id: 'block-features',
        type: 'feature_grid',
        items: [
          {
            id: 'feature-1',
            icon: 'Radar',
            title: 'Narrative Radar',
            description: 'Spot early trend shifts before they break into headlines.',
          },
          {
            id: 'feature-2',
            icon: 'ShieldCheck',
            title: 'Reputation Shield',
            description: 'Detect risk signals and coordinate rapid response plans.',
          },
          {
            id: 'feature-3',
            icon: 'BarChart3',
            title: 'Executive Insights',
            description: 'Deliver daily briefings with source-level attribution.',
          },
        ],
      },
      {
        id: 'block-testimonials',
        type: 'testimonials',
        items: [
          {
            id: 'testimonial-1',
            name: 'Lina Ortiz',
            role: 'Director of Communications',
            photo: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=800',
            quote:
              'NPIP compressed our crisis response time from hours to minutes. The signal clarity is unmatched.',
          },
          {
            id: 'testimonial-2',
            name: 'Rahul Sharma',
            role: 'Chief Marketing Officer',
            photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=800',
            quote:
              'We finally have a unified view of the public conversation without juggling five tools.',
          },
        ],
      },
      {
        id: 'block-gallery',
        type: 'gallery',
        items: [
          {
            id: 'gallery-1',
            image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=900',
            caption: 'Crisis response command center with live updates.',
          },
          {
            id: 'gallery-2',
            image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=900',
            caption: 'Stakeholder briefings with sentiment snapshots.',
          },
          {
            id: 'gallery-3',
            image: 'https://images.unsplash.com/photo-1485217988980-11786ced9454?q=80&w=900',
            caption: 'Daily intelligence briefings delivered to leaders.',
          },
        ],
      },
      {
        id: 'block-cta',
        type: 'cta_band',
        text: 'Ready to bring clarity to the conversation?',
        buttonText: 'Request access',
        buttonLink: '/request-access',
      },
    ],
  },
  {
    id: 'page-about',
    title: 'About',
    slug: 'about',
    status: 'published',
    updatedAt: now,
    updatedBy: { id: 'user-2', name: 'Jordan Lee', email: 'jordan@npip.ai' },
    seo: {
      metaTitle: 'About NPIP',
      metaDescription: 'Our mission is to deliver clarity, speed, and confidence to global teams.',
      slug: 'about',
      canonical: 'https://npip.ai/about',
    },
    blocks: [
      {
        id: 'about-hero',
        type: 'hero',
        title: 'We help leaders see around corners.',
        subtitle: 'NPIP is built by analysts, journalists, and engineers obsessed with clarity.',
        ctaText: 'Meet the team',
        ctaLink: '/about#team',
        backgroundImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1600',
      },
      {
        id: 'about-rich',
        type: 'rich_text',
        content:
          '### Our story\n\nWe started NPIP to bring trust and accountability to fast-moving public narratives. Today we support government, NGOs, and enterprise teams worldwide.',
      },
    ],
  },
  {
    id: 'page-contact',
    title: 'Contact',
    slug: 'contact',
    status: 'draft',
    updatedAt: now,
    updatedBy: { id: 'user-3', name: 'Morgan Park', email: 'morgan@npip.ai' },
    seo: {
      metaTitle: 'Contact NPIP',
      metaDescription: 'Reach our team for demos, partnerships, and support.',
      slug: 'contact',
      canonical: 'https://npip.ai/contact',
    },
    blocks: [
      {
        id: 'contact-rich',
        type: 'rich_text',
        content:
          '### Let’s connect\n\nSend us a note and we will respond within 24 hours. You can also reach our operations team by phone or WhatsApp.',
      },
      {
        id: 'contact-cta',
        type: 'cta_band',
        text: 'Need immediate support?',
        buttonText: 'Chat with support',
        buttonLink: '/support',
      },
    ],
  },
  {
    id: 'page-faq',
    title: 'FAQ',
    slug: 'faq',
    status: 'published',
    updatedAt: now,
    updatedBy: { id: 'user-2', name: 'Jordan Lee', email: 'jordan@npip.ai' },
    seo: {
      metaTitle: 'FAQ',
      metaDescription: 'Frequently asked questions about NPIP.',
      slug: 'faq',
      canonical: 'https://npip.ai/faq',
    },
    blocks: [
      {
        id: 'faq-rich',
        type: 'rich_text',
        content:
          '### Frequently asked questions\n\n1. **Which sources are supported?**\n2. **How quickly do alerts arrive?**\n3. **Can I export reports?**',
      },
    ],
  },
  {
    id: 'page-privacy',
    title: 'Privacy',
    slug: 'privacy',
    status: 'published',
    updatedAt: now,
    updatedBy: { id: 'user-4', name: 'Taylor Nguyen', email: 'taylor@npip.ai' },
    seo: {
      metaTitle: 'Privacy Policy',
      metaDescription: 'Our commitment to privacy and data handling.',
      slug: 'privacy',
      canonical: 'https://npip.ai/privacy',
    },
    blocks: [
      {
        id: 'privacy-rich',
        type: 'rich_text',
        content:
          '### Privacy policy\n\nWe prioritize transparency in how we collect, store, and use data.',
      },
    ],
  },
  {
    id: 'page-terms',
    title: 'Terms',
    slug: 'terms',
    status: 'published',
    updatedAt: now,
    updatedBy: { id: 'user-4', name: 'Taylor Nguyen', email: 'taylor@npip.ai' },
    seo: {
      metaTitle: 'Terms of Service',
      metaDescription: 'Terms and conditions for using NPIP.',
      slug: 'terms',
      canonical: 'https://npip.ai/terms',
    },
    blocks: [
      {
        id: 'terms-rich',
        type: 'rich_text',
        content:
          '### Terms of service\n\nBy using NPIP you agree to the following terms and conditions.',
      },
    ],
  },
]

export const mockAdminPageSummaries: AdminPageSummary[] = mockAdminPages.map((page) => ({
  id: page.id,
  title: page.title,
  slug: page.slug,
  status: page.status,
  updatedAt: page.updatedAt,
  updatedBy: page.updatedBy,
}))

export const mockMediaLibrary: MediaItem[] = [
  {
    id: 'media-1',
    url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=1200',
    title: 'Executive briefing room',
    alt: 'Team reviewing analytics on a large screen',
    createdAt: now,
  },
  {
    id: 'media-2',
    url: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1200',
    title: 'Media monitoring',
    alt: 'Analyst reviewing dashboards with multiple charts',
    createdAt: now,
  },
  {
    id: 'media-3',
    url: 'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?q=80&w=1200',
    title: 'Collaboration space',
    alt: 'Team collaborating in a modern workspace',
    createdAt: now,
  },
]
