import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/apiError.js';
import ApiResponse from '../utils/apiResponse.js';
import { AdminPage } from '../model/adminPage.model.js';
import { AdminMedia } from '../model/adminMedia.model.js';

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

const ensureDefaultPages = async () => {
    const homeBlocks = [
        {
            id: 'home-hero',
            type: 'hero',
            title: 'A modern intelligence desk for Nepali media signals.',
            subtitle:
                'Build projects, monitor public mentions, and act on sentiment shifts with an infrastructure tuned for Nepal.',
            ctaText: 'Start Monitoring',
            ctaLink: '/login',
            backgroundImage: '',
        },
        {
            id: 'home-highlights',
            type: 'feature_grid',
            items: [
                {
                    id: 'highlight-1',
                    icon: 'Radar',
                    title: 'Public signal intake',
                    description:
                        'Track public mentions across Nepali news, YouTube, Reddit and optional connectors.',
                },
                {
                    id: 'highlight-2',
                    icon: 'Languages',
                    title: 'Nepali + English sentiment',
                    description:
                        'Devanagari-aware language detection with multilingual sentiment scoring.',
                },
                {
                    id: 'highlight-3',
                    icon: 'Bell',
                    title: 'Alerts & reports',
                    description: 'Real-time spike alerts, email digests, and exportable PDF summaries.',
                },
            ],
        },
        {
            id: 'home-sources',
            type: 'rich_text',
            content:
                '### Source reality check\n\n- Local news + YouTube + Reddit are the reliable MVP sources.\n- X, Meta, TikTok, Viber remain gated or best-effort.\n- Public data only, respecting robots.txt and platform ToS.\n\n### Data sources\n\n- Local News RSS\n- YouTube API\n- Reddit API\n- X (paid)\n- Meta (owned)\n- TikTok (best-effort)',
        },
        {
            id: 'home-workflow',
            type: 'feature_grid',
            items: [
                {
                    id: 'workflow-1',
                    icon: 'ClipboardCheck',
                    title: 'Create a project',
                    description: 'Define keywords, boolean queries, and the sources you want to monitor.',
                },
                {
                    id: 'workflow-2',
                    icon: 'Database',
                    title: 'Ingest mentions',
                    description: 'Schedule connectors to collect mentions across the supported stack.',
                },
                {
                    id: 'workflow-3',
                    icon: 'TrendingUp',
                    title: 'Act on insights',
                    description: 'Use sentiment, top sources, and alerts to take action quickly.',
                },
            ],
        },
        {
            id: 'home-cta',
            type: 'cta_band',
            text: "Ready to monitor Nepal's public conversation?",
            buttonText: 'Start Monitoring',
            buttonLink: '/login',
        },
        {
            id: 'home-footer',
            type: 'rich_text',
            content:
                "NPIP - Nepal's Public Figure Information Portal\n\nBuilt for Nepal's public data ecosystem.",
        },
    ];

    await AdminPage.findOneAndUpdate(
        { slug: 'home' },
        {
            title: 'Home',
            slug: 'home',
            status: 'published',
            seo: {
                metaTitle: "NPIP - Nepal's Public Figure Intelligence Portal",
                metaDescription:
                    'Build projects, monitor public mentions, and act on sentiment shifts with an infrastructure tuned for Nepal.',
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

    const defaults = [
        {
            title: 'About',
            slug: 'about',
            blocks: [
                {
                    id: 'about-hero',
                    type: 'hero',
                    title: 'Built for Nepal’s public data ecosystem.',
                    subtitle:
                        'NPIP helps teams track real-time narratives, sentiment, and media coverage with transparency.',
                    ctaText: 'See the platform',
                    ctaLink: '/login',
                    backgroundImage: '',
                },
                {
                    id: 'about-rich',
                    type: 'rich_text',
                    content:
                        '### Our mission\n\nWe bring clarity to the public conversation by combining trusted sources with responsible AI.\n\n### What we believe\n\n- Transparency in data sourcing\n- Respect for platform ToS\n- Fast, reliable intelligence for teams',
                },
            ],
        },
        {
            title: 'Contact',
            slug: 'contact',
            blocks: [
                {
                    id: 'contact-rich',
                    type: 'rich_text',
                    content:
                        '### Get in touch\n\nFor demos, partnerships, or support, reach us at **support@npip.ai**.\n\nWe respond within 1 business day.',
                },
                {
                    id: 'contact-cta',
                    type: 'cta_band',
                    text: 'Need a live walkthrough?',
                    buttonText: 'Book a demo',
                    buttonLink: '/login',
                },
            ],
        },
        {
            title: 'FAQ',
            slug: 'faq',
            blocks: [
                {
                    id: 'faq-rich',
                    type: 'rich_text',
                    content:
                        '### Frequently asked questions\n\n- **Which sources are supported?**\n  Local news, YouTube, Reddit, and optional connectors.\n- **How fresh is the data?**\n  Depends on ingest schedule; most teams use 30-60 minute cycles.\n- **Can we export reports?**\n  Yes, PDF and CSV exports are available in the dashboard.',
                },
            ],
        },
        {
            title: 'Privacy',
            slug: 'privacy',
            blocks: [
                {
                    id: 'privacy-rich',
                    type: 'rich_text',
                    content:
                        '### Privacy policy\n\nWe only process publicly available data and respect platform policies. We do not sell personal data and we maintain strict access controls.',
                },
            ],
        },
        {
            title: 'Terms',
            slug: 'terms',
            blocks: [
                {
                    id: 'terms-rich',
                    type: 'rich_text',
                    content:
                        '### Terms of service\n\nBy using NPIP, you agree to use the platform responsibly and comply with all relevant laws and platform policies.',
                },
            ],
        },
    ]
        .filter((page) => !existingSlugs.has(page.slug))
        .map((page) => ({
            ...page,
            status: 'published',
            seo: {
                metaTitle: page.title,
                metaDescription: '',
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

    const media = await AdminMedia.create({
        url,
        title: req.body?.title || '',
        alt: req.body?.alt || '',
        createdBy: req.user?._id,
    });

    return res.status(201).json(new ApiResponse(201, toAdminMediaDTO(media), 'Media uploaded'));
});

export const deleteAdminMedia = asyncHandler(async (req, res) => {
    const media = await AdminMedia.findByIdAndDelete(req.params.id);
    if (!media) throw new ApiError(404, 'Media not found');

    if (media.url?.startsWith('/uploads/')) {
        const filePath = path.join(uploadsDir, path.basename(media.url));
        fs.promises.unlink(filePath).catch(() => {});
    }

    return res.status(200).json(new ApiResponse(200, null, 'Media deleted'));
});
