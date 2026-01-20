import { fetchWikiProfile } from '../services/wiki.service.js';
import { fetchNews } from '../services/news.service.js';

const buildRecentActivities = (articles) => {
    return articles.slice(0, 3).map((article) => ({
        title: article.title,
        publishedAt: article.publishedAt,
        source: article.source,
        url: article.url,
    }));
};

export const searchFigure = async (req, res, next) => {
    try {
        const query = typeof req.query?.query === 'string' ? req.query.query.trim() : '';
        if (!query) {
            return res.status(400).json({ error: 'Query is required' });
        }

        const [wikiPayload, newsPayload] = await Promise.all([
            fetchWikiProfile(query),
            fetchNews(query),
        ]);

        const person = wikiPayload?.person || null;
        const candidates = wikiPayload?.candidates || [];
        const isDisambiguation = Boolean(wikiPayload?.isDisambiguation);
        const articles = newsPayload?.articles || [];

        res.json({
            query,
            person,
            candidates,
            isDisambiguation,
            recentActivities: buildRecentActivities(articles),
            news: articles,
            metadata: {
                newsProvider: 'gnews',
                warning: newsPayload?.warning || null,
            },
        });
    } catch (err) {
        next(err);
    }
};
