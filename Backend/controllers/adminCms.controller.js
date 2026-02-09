import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { AdminPage } from '../model/adminPage.model.js';
import { AdminMedia } from '../model/adminMedia.model.js';
import { deleteFromCloudinary, isCloudinaryEnabled, uploadToCloudinary } from '../utils/cloudinary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', 'uploads');

const toAdminUser = (user) =>
    user
        ? {
              id: user._id?.toString(),
              name: user.fullName || user.username,
              email: user.email,
          }
        : undefined;

const toAdminPageDTO = (page) => ({
    id: page.slug,
    title: page.title,
    slug: page.slug,
    status: page.status,
    updatedAt: page.updatedAt,
    updatedBy: toAdminUser(page.updatedBy),
    seo: page.seo,
    blocks: page.blocks,
});

const toAdminPageSummaryDTO = (page) => ({
    id: page.slug,
    title: page.title,
    slug: page.slug,
    status: page.status,
    updatedAt: page.updatedAt,
    updatedBy: toAdminUser(page.updatedBy),
});

const toAdminMediaDTO = (media) => ({
    id: media._id.toString(),
    url: media.url,
    title: media.title,
    alt: media.alt,
    createdAt: media.createdAt,
});

// ═══════════════════════════════════════════════════════════════════════════════
// DEFAULT PAGES SEEDER
// Creates production-ready placeholder content for all public pages
// ═══════════════════════════════════════════════════════════════════════════════
const ensureDefaultPages = async () => {
    // ─────────────────────────────────────────────────────────────────────────────
    // HOME PAGE CONTENT
    // ─────────────────────────────────────────────────────────────────────────────
    const homeBlocks = [
        {
            id: 'home-hero',
            type: 'hero',
            title: "Nepal's Premier Media Intelligence Platform",
            subtitle:
                "Monitor public sentiment, track media mentions, and gain actionable insights across Nepal's digital landscape. Built specifically for the Nepali media ecosystem.",
            ctaText: 'Start Free Trial',
            ctaLink: '/register',
            backgroundImage: '',
        },
        {
            id: 'home-features',
            type: 'feature_grid',
            items: [
                {
                    id: 'feature-1',
                    icon: 'Radar',
                    title: 'Real-Time Monitoring',
                    description:
                        'Track mentions across 50+ Nepali news sources, YouTube channels, Reddit communities, and social platforms in real-time.',
                },
                {
                    id: 'feature-2',
                    icon: 'Languages',
                    title: 'Bilingual Sentiment Analysis',
                    description:
                        'Advanced AI that understands both Nepali (Devanagari) and English content with accurate sentiment scoring.',
                },
                {
                    id: 'feature-3',
                    icon: 'Bell',
                    title: 'Smart Alerts',
                    description:
                        'Get instant notifications for sentiment spikes, trending topics, or specific keywords via email and in-app alerts.',
                },
                {
                    id: 'feature-4',
                    icon: 'BarChart3',
                    title: 'Visual Analytics',
                    description:
                        'Interactive dashboards with trend analysis, source breakdown, and sentiment over time visualizations.',
                },
                {
                    id: 'feature-5',
                    icon: 'FileText',
                    title: 'Automated Reports',
                    description:
                        'Generate professional PDF reports with customizable date ranges, filters, and branding options.',
                },
                {
                    id: 'feature-6',
                    icon: 'Shield',
                    title: 'Privacy-First',
                    description:
                        'We only process publicly available data while respecting platform policies and user privacy.',
                },
            ],
        },
        {
            id: 'home-how-it-works',
            type: 'rich_text',
            content: `## How NPIP Works

### 1. Create Your Project
Set up monitoring for your brand, organization, or topic of interest. Define keywords, boolean queries, and select the sources you want to track.

### 2. Automated Data Collection
Our connectors continuously scan Nepali news sites, YouTube, Reddit, and other platforms for relevant mentions. Data is processed and analyzed in near real-time.

### 3. AI-Powered Analysis
Each mention is analyzed for sentiment, language, relevance, and key entities. Our models are specifically trained for Nepali language nuances.

### 4. Actionable Insights
Access your dashboard to see trends, top sources, sentiment shifts, and emerging narratives. Set up alerts to stay ahead of the conversation.`,
        },
        {
            id: 'home-sources',
            type: 'feature_grid',
            items: [
                {
                    id: 'source-1',
                    icon: 'Newspaper',
                    title: 'Local News',
                    description:
                        '50+ Nepali news portals including Kantipur, Ratopati, Setopati, Online Khabar, and regional outlets.',
                },
                {
                    id: 'source-2',
                    icon: 'Youtube',
                    title: 'YouTube',
                    description:
                        'Video content, comments, and transcripts from Nepali YouTube channels and news broadcasts.',
                },
                {
                    id: 'source-3',
                    icon: 'MessageCircle',
                    title: 'Reddit',
                    description:
                        'Discussions from r/Nepal and related subreddits where Nepali communities engage.',
                },
                {
                    id: 'source-4',
                    icon: 'Globe',
                    title: 'More Sources',
                    description:
                        'Optional connectors for X (Twitter), Facebook public pages, and TikTok (availability varies).',
                },
            ],
        },
        {
            id: 'home-cta',
            type: 'cta_band',
            text: 'Ready to understand what Nepal is saying about you?',
            buttonText: 'Get Started Free',
            buttonLink: '/register',
        },
    ];

    await AdminPage.findOneAndUpdate(
        { slug: 'home' },
        {
            title: 'Home',
            slug: 'home',
            status: 'published',
            seo: {
                metaTitle: "NPIP - Nepal's Public Figure Intelligence Platform | Media Monitoring & Sentiment Analysis",
                metaDescription:
                    "Monitor public sentiment, track media mentions, and gain actionable insights across Nepal's digital landscape. Real-time monitoring of 50+ Nepali news sources.",
                slug: 'home',
                canonical: '',
                ogImage: '',
            },
            blocks: homeBlocks,
        },
        { upsert: true, new: true }
    );

    const existingSlugs = new Set(
        (await AdminPage.find({}, { slug: 1 }).lean()).map((page) => page.slug)
    );

    // ─────────────────────────────────────────────────────────────────────────────
    // DEFAULT PAGES - Only created if they don't exist
    // ─────────────────────────────────────────────────────────────────────────────
    const defaults = [
        // ABOUT PAGE
        {
            title: 'About',
            slug: 'about',
            seoTitle: 'About NPIP - Our Mission & Story | Nepal Media Intelligence',
            seoDescription:
                "Learn about NPIP's mission to bring transparency and intelligence to Nepal's public conversation through responsible data collection and AI-powered analysis.",
            blocks: [
                {
                    id: 'about-hero',
                    type: 'hero',
                    title: "Bringing Clarity to Nepal's Public Conversation",
                    subtitle:
                        "NPIP was built to help organizations, journalists, researchers, and public figures understand and navigate Nepal's rapidly evolving media landscape.",
                    ctaText: 'Contact Us',
                    ctaLink: '/contact',
                    backgroundImage: '',
                },
                {
                    id: 'about-story',
                    type: 'rich_text',
                    content: `## Our Story

NPIP (Nepal Public Intelligence Platform) was founded with a simple observation: Nepal's digital media landscape is vibrant, diverse, and growing rapidly—but tools to understand it were either non-existent or not built for Nepali content.

International media monitoring tools often ignore Nepali language content, miss local news sources, and lack understanding of Nepal's unique media ecosystem. We set out to change that.

## Our Mission

We believe that access to public sentiment data should be:

- **Accessible** - Not just for large corporations but for NGOs, researchers, and local organizations
- **Accurate** - Built specifically for Nepali and English bilingual content
- **Responsible** - Respecting user privacy and platform policies
- **Actionable** - Providing insights that lead to better decisions

## What Makes Us Different

### Nepal-First Approach
Every feature, from sentiment analysis to source coverage, is designed specifically for the Nepali context. Our AI models understand Devanagari script, Nepali colloquialisms, and local cultural references.

### Ethical Data Collection
We only process publicly available data. We respect robots.txt, platform terms of service, and never access private communications. Transparency in our methods is core to our values.

### Local Source Coverage
We maintain relationships with Nepali media houses and continuously expand our coverage of local news sources, YouTube channels, and community platforms.`,
                },
                {
                    id: 'about-team',
                    type: 'rich_text',
                    content: `## Our Team

NPIP is built by a team of Nepali technologists, data scientists, and media professionals who understand the local landscape intimately.

We combine deep technical expertise in natural language processing and machine learning with practical understanding of how media, PR, and communications work in Nepal.

## Join Us

We're always looking for talented individuals passionate about media intelligence, AI, and Nepal's digital future. Check our careers page or reach out directly.`,
                },
                {
                    id: 'about-cta',
                    type: 'cta_band',
                    text: 'Want to learn more about how NPIP can help your organization?',
                    buttonText: 'Schedule a Demo',
                    buttonLink: '/contact',
                },
            ],
        },
        // FAQ PAGE
        {
            title: 'FAQ',
            slug: 'faq',
            seoTitle: 'Frequently Asked Questions | NPIP Nepal Media Monitoring',
            seoDescription:
                "Find answers to common questions about NPIP's media monitoring platform, data sources, pricing, and features.",
            blocks: [
                {
                    id: 'faq-hero',
                    type: 'hero',
                    title: 'Frequently Asked Questions',
                    subtitle: 'Everything you need to know about NPIP and media monitoring in Nepal.',
                    ctaText: '',
                    ctaLink: '',
                    backgroundImage: '',
                },
                {
                    id: 'faq-general',
                    type: 'rich_text',
                    content: `## General Questions

### What is NPIP?
NPIP (Nepal Public Intelligence Platform) is a media monitoring and sentiment analysis tool built specifically for Nepal's media ecosystem. It tracks mentions across Nepali news sites, YouTube, Reddit, and social platforms, providing real-time insights and analytics.

### Who is NPIP for?
NPIP serves a wide range of users including:
- **PR & Communications teams** tracking brand mentions
- **Political campaigns** monitoring public sentiment
- **NGOs & INGOs** understanding public discourse on key issues
- **Journalists & researchers** tracking stories and trends
- **Public figures** managing their media presence

### How is NPIP different from Google Alerts?
Google Alerts is a general-purpose tool that often misses Nepali language content and local news sources. NPIP is built specifically for Nepal with:
- Coverage of 50+ Nepali news sources
- Nepali language sentiment analysis
- YouTube and Reddit monitoring
- Advanced filtering and boolean queries
- Professional analytics and reporting`,
                },
                {
                    id: 'faq-data',
                    type: 'rich_text',
                    content: `## Data & Sources

### Which sources does NPIP monitor?
Currently, NPIP monitors:
- **Local News**: 50+ Nepali news portals including Kantipur, Ratopati, Setopati, Online Khabar, Himalayan Times, and many more
- **YouTube**: Videos, comments, and transcripts from Nepali channels
- **Reddit**: r/Nepal and related subreddits
- **Optional**: X (Twitter), Facebook public pages, TikTok (availability varies by platform API access)

### How fresh is the data?
Data freshness depends on your plan and the source:
- **News sources**: Typically 15-30 minutes
- **YouTube**: 1-2 hours for new videos
- **Reddit**: Near real-time for new posts
- **Social platforms**: Varies based on API access

### Is the data accurate?
Our sentiment analysis achieves approximately 85% accuracy on Nepali content, which is significantly higher than generic tools. We continuously improve our models based on feedback and new training data.`,
                },
                {
                    id: 'faq-features',
                    type: 'rich_text',
                    content: `## Features & Functionality

### Can I track multiple topics or brands?
Yes! Each plan includes a certain number of "projects." Each project can have its own keywords, boolean queries, and source filters. Pro and Enterprise plans support multiple projects.

### What are boolean queries?
Boolean queries let you create precise search criteria using AND, OR, NOT operators and parentheses. For example: \`(Nepal OR Nepali) AND tourism NOT covid\` would find mentions about Nepali tourism excluding COVID-related content.

### Can I export data?
Yes, all plans include export functionality:
- **PDF Reports**: Professional formatted reports with charts
- **CSV Export**: Raw data for further analysis
- **API Access**: Available on Enterprise plans

### How do alerts work?
You can set up alerts for:
- **Keyword matches**: Get notified when specific terms appear
- **Sentiment spikes**: Alert when sentiment shifts significantly
- **Volume spikes**: Alert when mention volume increases unusually

Alerts can be delivered via email or in-app notifications.`,
                },
                {
                    id: 'faq-pricing',
                    type: 'rich_text',
                    content: `## Pricing & Plans

### Is there a free trial?
Yes! We offer a 14-day free trial with full access to Pro features. No credit card required.

### What's included in each plan?
Visit our [Pricing page](/pricing) for detailed plan comparisons. Generally:
- **Starter**: 1 project, basic sources, email reports
- **Pro**: 5 projects, all sources, API access, priority support
- **Enterprise**: Unlimited projects, custom integrations, dedicated support

### Can I change plans later?
Absolutely. You can upgrade or downgrade at any time. When upgrading, you get immediate access to new features. When downgrading, changes take effect at the next billing cycle.

### Do you offer discounts for NGOs?
Yes, we offer significant discounts for registered non-profits, academic institutions, and journalists. Contact us for details.`,
                },
                {
                    id: 'faq-cta',
                    type: 'cta_band',
                    text: "Still have questions? We're here to help.",
                    buttonText: 'Contact Support',
                    buttonLink: '/contact',
                },
            ],
        },
        // CONTACT PAGE
        {
            title: 'Contact',
            slug: 'contact',
            seoTitle: 'Contact Us | NPIP Nepal Media Intelligence Platform',
            seoDescription:
                'Get in touch with NPIP for demos, support, partnerships, or general inquiries. We respond within 24 hours.',
            blocks: [
                {
                    id: 'contact-hero',
                    type: 'hero',
                    title: 'Get in Touch',
                    subtitle: "Have questions about NPIP? Want a personalized demo? We'd love to hear from you.",
                    ctaText: '',
                    ctaLink: '',
                    backgroundImage: '',
                },
                {
                    id: 'contact-info',
                    type: 'rich_text',
                    content: `## Contact Information

### General Inquiries
**Email**: hello@npip.com.np
**Response Time**: Within 24 hours

### Sales & Demos
**Email**: sales@npip.com.np
**Phone**: +977-1-XXXXXXX
Schedule a personalized demo to see how NPIP can work for your organization.

### Technical Support
**Email**: support@npip.com.np
For existing customers with technical issues or questions.

### Office Address
Kathmandu, Nepal
*(Full address provided upon request)*

## Business Hours
**Sunday - Friday**: 10:00 AM - 6:00 PM NPT
**Saturday**: Closed`,
                },
                {
                    id: 'contact-demo',
                    type: 'rich_text',
                    content: `## Book a Demo

See NPIP in action with a personalized walkthrough tailored to your use case.

**What to expect:**
- 30-minute live demonstration
- Custom setup for your industry/needs
- Q&A with our product team
- No commitment required

**Best for:**
- Organizations evaluating media monitoring solutions
- Teams wanting to see specific features in action
- Decision makers needing to understand ROI`,
                },
                {
                    id: 'contact-cta',
                    type: 'cta_band',
                    text: 'Ready to see NPIP in action?',
                    buttonText: 'Book Your Demo',
                    buttonLink: '/register',
                },
            ],
        },
        // PRIVACY PAGE
        {
            title: 'Privacy Policy',
            slug: 'privacy',
            seoTitle: 'Privacy Policy | NPIP Nepal Media Intelligence',
            seoDescription:
                'Learn how NPIP collects, uses, and protects your data. We are committed to transparency and privacy-first practices.',
            blocks: [
                {
                    id: 'privacy-hero',
                    type: 'hero',
                    title: 'Privacy Policy',
                    subtitle: 'Last updated: January 2025',
                    ctaText: '',
                    ctaLink: '',
                    backgroundImage: '',
                },
                {
                    id: 'privacy-content',
                    type: 'rich_text',
                    content: `## Introduction

NPIP ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our media monitoring platform.

## Information We Collect

### Account Information
When you create an account, we collect:
- Name and email address
- Organization name (optional)
- Password (encrypted)
- Billing information (processed by secure payment providers)

### Usage Data
We automatically collect:
- Log data (IP address, browser type, pages visited)
- Device information
- Feature usage patterns
- Search queries within the platform

### Monitored Data
The media content we monitor is **publicly available information** from news websites, public YouTube videos, public Reddit posts, and public social media posts.

**We do not access private messages, private accounts, or any non-public content.**

## How We Use Your Information

We use collected information to:
- Provide and maintain our services
- Process your transactions
- Send you service-related communications
- Improve our platform and develop new features
- Respond to your inquiries and support requests
- Comply with legal obligations

## Data Storage and Security

- Your account data is stored on secure servers
- We use industry-standard encryption for data in transit and at rest
- Regular security audits and access controls
- Employee training on data protection

## Your Rights

You have the right to:
- Access your personal data
- Correct inaccurate data
- Delete your account and associated data
- Export your data
- Opt-out of marketing communications

To exercise these rights, contact us at privacy@npip.com.np

## Contact Us

For privacy-related questions: **privacy@npip.com.np**`,
                },
            ],
        },
        // TERMS PAGE
        {
            title: 'Terms of Service',
            slug: 'terms',
            seoTitle: 'Terms of Service | NPIP Nepal Media Intelligence',
            seoDescription:
                "Read the terms and conditions governing your use of NPIP's media monitoring platform.",
            blocks: [
                {
                    id: 'terms-hero',
                    type: 'hero',
                    title: 'Terms of Service',
                    subtitle: 'Last updated: January 2025',
                    ctaText: '',
                    ctaLink: '',
                    backgroundImage: '',
                },
                {
                    id: 'terms-content',
                    type: 'rich_text',
                    content: `## Agreement to Terms

By accessing or using NPIP ("the Service"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.

## Description of Service

NPIP is a media monitoring and sentiment analysis platform that collects and indexes publicly available media content, provides search, filtering, and analytics capabilities, and generates reports and alerts based on monitored content.

## Account Registration

- You must be at least 18 years old and capable of forming a binding contract
- You are responsible for maintaining the confidentiality of your account credentials
- You must notify us immediately of any unauthorized access
- You are responsible for all activities under your account

## Acceptable Use

### You May:
- Use the Service for legitimate media monitoring purposes
- Share reports with your organization or clients
- Export data for your own analysis

### You May Not:
- Use the Service for illegal purposes
- Attempt to access non-public data or bypass security measures
- Resell or redistribute raw data without authorization
- Use the Service to harass, defame, or harm others
- Overload our systems with excessive automated requests

## Payment Terms

- Prices are listed on our pricing page
- Subscriptions are billed monthly or annually
- We offer a 14-day money-back guarantee for new subscriptions
- No refunds for partial months

## Limitation of Liability

The Service is provided "as is" without warranties of any kind. We do not guarantee the accuracy, completeness, or timeliness of monitored data. To the maximum extent permitted by law, NPIP shall not be liable for any indirect, incidental, special, or consequential damages.

## Termination

You may cancel your account at any time through the dashboard or by contacting support. We may suspend or terminate your account for violation of these Terms, non-payment, or conduct that harms other users.

## Contact

For questions about these Terms: **legal@npip.com.np**`,
                },
            ],
        },
        // PRICING PAGE
        {
            title: 'Pricing',
            slug: 'pricing',
            seoTitle: 'Pricing Plans | NPIP Nepal Media Monitoring',
            seoDescription:
                'Choose the right NPIP plan for your needs. From startups to enterprises, we have flexible pricing for media monitoring in Nepal.',
            blocks: [
                {
                    id: 'pricing-hero',
                    type: 'hero',
                    title: 'Simple, Transparent Pricing',
                    subtitle: 'Start with a 14-day free trial. No credit card required.',
                    ctaText: 'Start Free Trial',
                    ctaLink: '/register',
                    backgroundImage: '',
                },
                {
                    id: 'pricing-plans',
                    type: 'feature_grid',
                    items: [
                        {
                            id: 'plan-starter',
                            icon: 'Zap',
                            title: 'Starter - NPR 5,000/mo',
                            description:
                                '1 project, 1,000 mentions/month, News + YouTube sources, Email reports, Email support',
                        },
                        {
                            id: 'plan-pro',
                            icon: 'Rocket',
                            title: 'Pro - NPR 15,000/mo',
                            description:
                                '5 projects, 10,000 mentions/month, All sources including Reddit, API access, Real-time alerts, Priority support',
                        },
                        {
                            id: 'plan-enterprise',
                            icon: 'Building',
                            title: 'Enterprise - Custom',
                            description:
                                'Unlimited projects, Unlimited mentions, Custom integrations, Dedicated account manager, SLA guarantee, On-premise option',
                        },
                    ],
                },
                {
                    id: 'pricing-features',
                    type: 'rich_text',
                    content: `## All Plans Include

- **Sentiment Analysis**: AI-powered sentiment scoring for Nepali and English
- **Boolean Queries**: Advanced search with AND, OR, NOT operators
- **Dashboard Analytics**: Visual trends, top sources, and mention breakdowns
- **PDF Reports**: Professional exportable reports
- **Secure Access**: SSL encryption and secure authentication

## Feature Comparison

| Feature | Starter | Pro | Enterprise |
|---------|---------|-----|------------|
| Projects | 1 | 5 | Unlimited |
| Mentions/month | 1,000 | 10,000 | Unlimited |
| News Sources | ✓ | ✓ | ✓ |
| YouTube | ✓ | ✓ | ✓ |
| Reddit | - | ✓ | ✓ |
| Real-time Alerts | - | ✓ | ✓ |
| API Access | - | ✓ | ✓ |
| Dedicated Support | - | - | ✓ |

## Frequently Asked Questions

**Can I switch plans anytime?**
Yes, upgrade or downgrade whenever you need.

**Is there a contract?**
No long-term contracts. Monthly plans can be cancelled anytime. Annual plans offer 2 months free.

**Do you offer discounts?**
Yes! NGOs, academic institutions, and journalists qualify for up to 50% off.`,
                },
                {
                    id: 'pricing-cta',
                    type: 'cta_band',
                    text: "Ready to start monitoring Nepal's media landscape?",
                    buttonText: 'Start Your Free Trial',
                    buttonLink: '/register',
                },
            ],
        },
    ]
        .filter((page) => !existingSlugs.has(page.slug))
        .map((page) => ({
            title: page.title,
            slug: page.slug,
            blocks: page.blocks,
            status: 'published',
            seo: {
                metaTitle: page.seoTitle || page.title,
                metaDescription: page.seoDescription || '',
                slug: page.slug,
                canonical: '',
                ogImage: '',
            },
        }));

    if (defaults.length) {
        await AdminPage.insertMany(defaults);
    }
};

export const listAdminPages = asyncHandler(async (_req, res) => {
    await ensureDefaultPages();
    const pages = await AdminPage.find()
        .sort({ updatedAt: -1 })
        .populate('updatedBy', 'fullName username email')
        .lean();
    const data = pages.map((page) => toAdminPageSummaryDTO(page));
    return res.status(200).json(new ApiResponse(200, data, 'Admin pages fetched'));
});

export const getAdminPage = asyncHandler(async (req, res) => {
    const identifier = req.params.id;
    const query = mongoose.isValidObjectId(identifier)
        ? { _id: identifier }
        : { slug: identifier.toLowerCase() };
    const page = await AdminPage.findOne(query)
        .populate('updatedBy', 'fullName username email')
        .lean();
    if (!page) throw new ApiError(404, 'Admin page not found');
    return res.status(200).json(new ApiResponse(200, toAdminPageDTO(page), 'Admin page fetched'));
});

export const updateAdminPage = asyncHandler(async (req, res) => {
    const { title, slug, status, seo, blocks } = req.body;

    if (!title?.trim()) {
        throw new ApiError(400, 'Page title is required');
    }
    if (!slug?.trim()) {
        throw new ApiError(400, 'Page slug is required');
    }

    const normalizedSlug = slug.toLowerCase().trim();
    const identifier = req.params.id;
    const query = mongoose.isValidObjectId(identifier)
        ? { _id: identifier }
        : { slug: identifier.toLowerCase() };
    const currentPage = await AdminPage.findOne(query);
    if (!currentPage) {
        throw new ApiError(404, 'Admin page not found');
    }

    const existing = await AdminPage.findOne({
        _id: { $ne: currentPage._id },
        slug: normalizedSlug,
    });
    if (existing) {
        throw new ApiError(409, 'Slug already in use');
    }

    const update = {
        title: title.trim(),
        slug: normalizedSlug,
        status: status === 'published' ? 'published' : 'draft',
        seo: {
            metaTitle: seo?.metaTitle ?? title.trim(),
            metaDescription: seo?.metaDescription ?? '',
            slug: normalizedSlug,
            canonical: seo?.canonical ?? '',
            ogImage: seo?.ogImage ?? '',
        },
        blocks: Array.isArray(blocks) ? blocks : [],
        updatedBy: req.user?._id,
    };

    const updatedPage = await AdminPage.findByIdAndUpdate(currentPage._id, update, {
        new: true,
        runValidators: true,
    }).populate('updatedBy', 'fullName username email');

    if (!updatedPage) {
        throw new ApiError(404, 'Admin page not found');
    }

    return res
        .status(200)
        .json(new ApiResponse(200, toAdminPageDTO(updatedPage), 'Admin page updated'));
});

export const listAdminMedia = asyncHandler(async (_req, res) => {
    const media = await AdminMedia.find().sort({ createdAt: -1 }).lean();
    const data = media.map((item) => toAdminMediaDTO(item));
    return res.status(200).json(new ApiResponse(200, data, 'Media fetched'));
});

export const uploadAdminMedia = asyncHandler(async (req, res) => {
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const url = fileUrl || req.body?.url;

    if (!url) {
        throw new ApiError(400, 'Media file or URL is required');
    }

    let mediaUrl = url;
    let provider = req.file ? 'local' : 'external';
    let publicId = '';

    if (req.file && isCloudinaryEnabled()) {
        try {
            const uploaded = await uploadToCloudinary(req.file.path);
            if (uploaded?.url) {
                mediaUrl = uploaded.url;
                publicId = uploaded.publicId || '';
                provider = 'cloudinary';
            }
        } catch {
            provider = 'local';
        }
    }

    const media = await AdminMedia.create({
        url: mediaUrl,
        localUrl: fileUrl || '',
        title: req.body?.title || '',
        alt: req.body?.alt || '',
        provider,
        publicId,
        createdBy: req.user?._id,
    });

    return res.status(201).json(new ApiResponse(201, toAdminMediaDTO(media), 'Media uploaded'));
});

export const deleteAdminMedia = asyncHandler(async (req, res) => {
    const media = await AdminMedia.findByIdAndDelete(req.params.id);
    if (!media) throw new ApiError(404, 'Media not found');

    if (media.provider === 'cloudinary' && media.publicId) {
        deleteFromCloudinary(media.publicId).catch(() => {});
    }

    const localPath = media.localUrl?.startsWith('/uploads/')
        ? media.localUrl
        : media.url?.startsWith('/uploads/')
          ? media.url
          : null;

    if (localPath) {
        const filePath = path.join(uploadsDir, path.basename(localPath));
        fs.promises.unlink(filePath).catch(() => {});
    }

    return res.status(200).json(new ApiResponse(200, null, 'Media deleted'));
});
