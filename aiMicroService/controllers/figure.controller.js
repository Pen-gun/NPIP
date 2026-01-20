import { fetchWikiProfile } from '../services/wiki.service.js';
import { fetchNews } from '../services/news.service.js';
import { fetchRssNews } from '../services/rss.service.js';
import { fetchYouTubeVideos } from '../services/youtube.service.js';

const buildRecentActivities = (articles) => {
    return articles.slice(0, 3).map((article) => ({
        title: article.title,
        publishedAt: article.publishedAt,
        source: article.source,
        url: article.url,
    }));
};

const normalizeTitle = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const dedupeArticles = (articles) => {
    const seenUrls = new Set();
    const seenTitles = new Set();
    const deduped = [];

    for (const article of articles) {
        const url = article.url || '';
        const normalizedTitle = normalizeTitle(article.title || '');

        if (url && seenUrls.has(url)) {
            continue;
        }

        if (normalizedTitle && seenTitles.has(normalizedTitle)) {
            continue;
        }

        if (url) {
            seenUrls.add(url);
        }
        if (normalizedTitle) {
            seenTitles.add(normalizedTitle);
        }

        deduped.push(article);
    }

    return deduped;
};

const sortByDate = (articles) => {
    return [...articles].sort((a, b) => {
        const aTime = Date.parse(a.publishedAt || '') || 0;
        const bTime = Date.parse(b.publishedAt || '') || 0;
        return bTime - aTime;
    });
};

const filterRelevant = (articles, query, personName) => {
    const target = (personName || query || '').toLowerCase().trim();
    if (!target) return articles;

    const rawTokens = target.split(/\s+/).filter(Boolean);
    const tokens = rawTokens.filter((token) => token.length >= 3);
    const lastName = rawTokens.length > 1 ? rawTokens[rawTokens.length - 1] : rawTokens[0];
    const hasStrongLastName = typeof lastName === 'string' && lastName.length >= 3;
    const minMatches = Math.min(2, tokens.length || 1);

    return articles.filter((article) => {
        const haystack = `${article.title || ''} ${article.description || ''}`.toLowerCase();
        if (hasStrongLastName && !haystack.includes(lastName)) {
            return false;
        }
        const hits = tokens.reduce((count, token) => (haystack.includes(token) ? count + 1 : count), 0);
        return hits >= minMatches;
    });
};

const cache = new Map();
const cacheTtlMs = Number(process.env.CACHE_TTL_MS) || 1000 * 60 * 10;

const getCached = (key) => {
    const cached = cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.createdAt > cacheTtlMs) {
        cache.delete(key);
        return null;
    }
    return cached.value;
};

const setCached = (key, value) => {
    cache.set(key, { value, createdAt: Date.now() });
};

export const searchFigure = async (req, res, next) => {
    try {
        const query = typeof req.query?.query === 'string' ? req.query.query.trim() : '';
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const cached = getCached(query.toLowerCase());
        if (cached) {
            return res.json(cached);
        }

        const wikiPayload = await fetchWikiProfile(query);

        const person = wikiPayload?.person || null;
        const candidates = wikiPayload?.candidates || [];
        const isDisambiguation = Boolean(wikiPayload?.isDisambiguation);

        if (isDisambiguation) {
            return res.json({
                query,
                person,
                candidates,
                isDisambiguation,
                recentActivities: [],
                news: [],
                videos: [],
                metadata: {
                    newsProvider: 'gnews',
                    warning: 'Select the correct person to load news',
                    sources: {
                        gnews: { ok: false, warning: 'Select a person to load news' },
                        rss: { ok: false, warning: 'Select a person to load news' },
                        youtube: { ok: false, warning: 'Select a person to load videos' },
                    },
                },
            });
        }

        const [newsResult, rssResult, youtubeResult] = await Promise.allSettled([
            fetchNews(query),
            fetchRssNews(query),
            fetchYouTubeVideos(query),
        ]);

        const newsPayload = newsResult.status === 'fulfilled' ? newsResult.value : { articles: [], warning: null };
        const rssArticles = rssResult.status === 'fulfilled' ? rssResult.value : [];
        const youtubePayload =
            youtubeResult.status === 'fulfilled'
                ? youtubeResult.value
                : { videos: [], warning: 'YouTube request failed' };

        const gnewsArticles = newsPayload?.articles || [];
        const combined = dedupeArticles([...gnewsArticles, ...rssArticles]);
        const filtered = filterRelevant(combined, query, person?.name);
        const timeline = sortByDate(filtered);
        const videos = youtubePayload?.videos || [];
        const warnings = [
            newsPayload?.warning,
            youtubePayload?.warning,
            newsResult.status === 'rejected' ? 'GNews request failed' : null,
            rssResult.status === 'rejected' ? 'RSS request failed' : null,
            youtubeResult.status === 'rejected' ? 'YouTube request failed' : null,
        ].filter(Boolean);

        const sources = {
            gnews: {
                ok: newsResult.status === 'fulfilled',
                warning:
                    newsPayload?.warning ||
                    (newsResult.status === 'rejected' ? 'GNews request failed' : null),
            },
            rss: {
                ok: rssResult.status === 'fulfilled',
                warning: rssResult.status === 'rejected' ? 'RSS request failed' : null,
            },
            youtube: {
                ok: youtubeResult.status === 'fulfilled',
                warning:
                    youtubePayload?.warning ||
                    (youtubeResult.status === 'rejected' ? 'YouTube request failed' : null),
            },
        };

        const responsePayload = {
            query,
            person,
            candidates,
            isDisambiguation,
            recentActivities: buildRecentActivities(timeline),
            news: timeline,
            videos,
            metadata: {
                newsProvider: 'gnews+rss',
                warning: warnings.length ? warnings.join(' | ') : null,
                sources,
            },
        };

        setCached(query.toLowerCase(), responsePayload);
        res.json(responsePayload);
    } catch (err) {
        next(err);
    }
};
