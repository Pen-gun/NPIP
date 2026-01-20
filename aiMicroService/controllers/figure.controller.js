import { fetchWikiProfile } from '../services/wiki.service.js';
import { fetchNews } from '../services/news.service.js';
import { fetchRssNews } from '../services/rss.service.js';

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

export const searchFigure = async (req, res, next) => {
    try {
        const query = typeof req.query?.query === 'string' ? req.query.query.trim() : '';
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
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
                metadata: {
                    newsProvider: 'gnews',
                    warning: 'Select the correct person to load news',
                },
            });
        }

        const [newsPayload, rssArticles] = await Promise.all([
            fetchNews(query),
            fetchRssNews(query),
        ]);

        const gnewsArticles = newsPayload?.articles || [];
        const combined = dedupeArticles([...gnewsArticles, ...rssArticles]);
        const timeline = sortByDate(combined);

        res.json({
            query,
            person,
            candidates,
            isDisambiguation,
            recentActivities: buildRecentActivities(timeline),
            news: timeline,
            metadata: {
                newsProvider: 'gnews+rss',
                warning: newsPayload?.warning || null,
            },
        });
    } catch (err) {
        next(err);
    }
};
