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
const normalizeTokens = (value) => normalizeTitle(value).split(/\s+/).filter(Boolean);

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

const STOPWORDS = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'of',
    'to',
    'in',
    'for',
    'on',
    'with',
    'from',
    'by',
    'at',
    'as',
    'is',
    'are',
    'was',
    'were',
    'will',
    'says',
    'said',
    'after',
    'before',
    'over',
    'into',
    'about',
    'amid',
    'against',
    'near',
    'up',
    'out',
    'new',
]);

const buildEventSignature = (title) => {
    if (!title) return '';
    const tokens = normalizeTitle(title)
        .split(' ')
        .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
    return tokens.slice(0, 6).join(' ');
};

const buildEventGroups = (articles) => {
    const groups = new Map();
    for (const article of articles) {
        const signature = buildEventSignature(article.title);
        const key = signature || normalizeTitle(article.title || '');
        if (!key) {
            continue;
        }
        if (!groups.has(key)) {
            groups.set(key, {
                title: article.title,
                latestPublishedAt: article.publishedAt,
                sources: new Set([article.source]),
                count: 1,
                url: article.url,
            });
        } else {
            const group = groups.get(key);
            group.count += 1;
            group.sources.add(article.source);
            const currentTime = Date.parse(article.publishedAt || '') || 0;
            const groupTime = Date.parse(group.latestPublishedAt || '') || 0;
            if (currentTime > groupTime) {
                group.latestPublishedAt = article.publishedAt;
                group.url = article.url;
                group.title = article.title;
            }
        }
    }

    return Array.from(groups.values())
        .map((group) => ({
            title: group.title,
            latestPublishedAt: group.latestPublishedAt,
            sources: Array.from(group.sources).filter(Boolean),
            count: group.count,
            url: group.url,
        }))
        .sort((a, b) => {
            const aTime = Date.parse(a.latestPublishedAt || '') || 0;
            const bTime = Date.parse(b.latestPublishedAt || '') || 0;
            return bTime - aTime;
        })
        .slice(0, 6);
};

const extractLocations = (articles, windowHours = 24) => {
    const now = Date.now();
    const cutoff = now - windowHours * 60 * 60 * 1000;
    const pattern =
        /\b(?:in|at|from|visited|arrived in|arrived at|met in|meeting in|rally in|speech in)\s+([A-Z][A-Za-z.\-]+(?:\s+[A-Z][A-Za-z.\-]+){0,3})/g;
    const seen = new Set();
    const locations = [];

    for (const article of articles) {
        const publishedAt = article.publishedAt || '';
        const timestamp = Date.parse(publishedAt);
        if (!timestamp || timestamp < cutoff) {
            continue;
        }

        const text = `${article.title || ''} ${article.description || ''}`;
        let match = pattern.exec(text);
        while (match) {
            const place = match[1].trim();
            const key = place.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                locations.push({
                    name: place,
                    source: article.source,
                    publishedAt: article.publishedAt,
                    url: article.url,
                });
            }
            match = pattern.exec(text);
        }
    }

    return locations.slice(0, 5);
};

const filterRelevant = (articles, query, personName, aliases = []) => {
    const target = (personName || query || '').toLowerCase().trim();
    if (!target) return articles;

    const baseTokens = normalizeTokens(target).filter((token) => token.length >= 3);
    const aliasTokens = aliases
        .flatMap((alias) => normalizeTokens(alias))
        .filter((token) => token.length >= 3);
    const tokens = Array.from(new Set([...baseTokens, ...aliasTokens]));
    const lastName = baseTokens.length > 1 ? baseTokens[baseTokens.length - 1] : baseTokens[0];
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

const getQueryParam = (req, key) =>
    typeof req.query?.[key] === 'string' ? req.query[key].trim() : '';

export const getFigureIdentity = async (req, res, next) => {
    try {
        const query = getQueryParam(req, 'query');
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const cacheKey = `identity:${query.toLowerCase()}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const wikiPayload = await fetchWikiProfile(query);
        const person = wikiPayload?.person || null;
        const candidates = wikiPayload?.candidates || [];
        const isDisambiguation = Boolean(wikiPayload?.isDisambiguation);

        const responsePayload = {
            query,
            person,
            candidates,
            isDisambiguation,
        };

        setCached(cacheKey, responsePayload);
        res.json(responsePayload);
    } catch (err) {
        next(err);
    }
};

export const getFigureNews = async (req, res, next) => {
    try {
        const name = getQueryParam(req, 'name');
        const query = getQueryParam(req, 'query') || name;
        const aliasesRaw = getQueryParam(req, 'aliases');
        const aliases = aliasesRaw ? aliasesRaw.split(',').map((value) => value.trim()).filter(Boolean) : [];

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const cacheKey = `news:${name.toLowerCase()}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const [newsResult, rssResult] = await Promise.allSettled([
            fetchNews(query),
            fetchRssNews(query),
        ]);

        const newsPayload = newsResult.status === 'fulfilled' ? newsResult.value : { articles: [], warning: null };
        const rssArticles = rssResult.status === 'fulfilled' ? rssResult.value : [];

        const gnewsArticles = newsPayload?.articles || [];
        const combined = dedupeArticles([...gnewsArticles, ...rssArticles]);
        const filtered = filterRelevant(combined, query, name, aliases);
        const timeline = sortByDate(filtered);

        const warnings = [
            newsPayload?.warning,
            newsResult.status === 'rejected' ? 'GNews request failed' : null,
            rssResult.status === 'rejected' ? 'RSS request failed' : null,
        ].filter(Boolean);

        const responsePayload = {
            query,
            name,
            recentActivities: buildRecentActivities(timeline),
            recentLocations: extractLocations(timeline),
            news: timeline,
            events: buildEventGroups(timeline),
            metadata: {
                newsProvider: 'gnews+rss',
                warning: warnings.length ? warnings.join(' | ') : null,
                sources: {
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
                },
            },
        };

        setCached(cacheKey, responsePayload);
        res.json(responsePayload);
    } catch (err) {
        next(err);
    }
};

export const getFigureVideos = async (req, res, next) => {
    try {
        const name = getQueryParam(req, 'name');
        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const cacheKey = `videos:${name.toLowerCase()}`;
        const cached = getCached(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        const youtubeResult = await Promise.allSettled([fetchYouTubeVideos(name)]);
        const result = youtubeResult[0];
        const youtubePayload =
            result.status === 'fulfilled' && result.value
                ? result.value
                : { videos: [], warning: 'YouTube request failed' };

        const responsePayload = {
            name,
            videos: youtubePayload?.videos || [],
            metadata: {
                warning: youtubePayload?.warning || null,
                sources: {
                    youtube: {
                        ok: result.status === 'fulfilled',
                        warning: youtubePayload?.warning || null,
                    },
                },
            },
        };

        setCached(cacheKey, responsePayload);
        res.json(responsePayload);
    } catch (err) {
        next(err);
    }
};

export const searchFigure = async (req, res, next) => {
    try {
        const query = getQueryParam(req, 'query');
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const cached = getCached(`search:${query.toLowerCase()}`);
        if (cached) {
            return res.json(cached);
        }

        const wikiPayload = await fetchWikiProfile(query);

        const person = wikiPayload?.person || null;
        const candidates = wikiPayload?.candidates || [];
        const isDisambiguation = Boolean(wikiPayload?.isDisambiguation);

        if (isDisambiguation) {
            const responsePayload = {
                query,
                person,
                candidates,
                isDisambiguation,
                recentActivities: [],
                recentLocations: [],
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
            };

            setCached(`search:${query.toLowerCase()}`, responsePayload);
            return res.json(responsePayload);
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
        const filtered = filterRelevant(combined, query, person?.name, person?.aliases || []);
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
            recentLocations: extractLocations(timeline),
            news: timeline,
            events: buildEventGroups(timeline),
            videos,
            metadata: {
                newsProvider: 'gnews+rss',
                warning: warnings.length ? warnings.join(' | ') : null,
                sources,
            },
        };

        setCached(`search:${query.toLowerCase()}`, responsePayload);
        res.json(responsePayload);
    } catch (err) {
        next(err);
    }
};
