import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const RSS_FEEDS = [
    { name: 'OnlineKhabar', url: 'https://www.onlinekhabar.com/rss' },
    { name: 'Kantipur', url: 'https://kathmandupost.com/rss' },
    { name: 'Setopati', url: 'https://en.setopati.com/rss' },
];

const parser = new XMLParser({ ignoreAttributes: false });

const fetchFeed = async (feed) => {
    const res = await fetch(feed.url, { timeout: 15_000 });
    if (!res.ok) {
        throw new Error(`RSS fetch failed: ${feed.name}`);
    }
    const text = await res.text();
    const parsed = parser.parse(text);
    const items = parsed?.rss?.channel?.item || parsed?.feed?.entry || [];
    return Array.isArray(items) ? items : [items];
};

const normalizeItem = (item, feedName) => {
    const title = item.title?.['#text'] || item.title || '';
    const description = item.description?.['#text'] || item.description || item.summary || '';
    const link = item.link?.['#text'] || item.link?.['@_href'] || item.link || '';
    const publishedAt = item.pubDate || item.published || item.updated || null;
    return {
        source: 'local_news',
        sourceLabel: feedName,
        title,
        text: description,
        url: link,
        publishedAt,
        author: item.author?.name || item.author || '',
        engagement: { likes: 0, comments: 0, shares: 0 },
        followerCount: 0,
    };
};

const localNewsConnector = {
    id: 'localNews',
    displayName: 'Nepal Local News',
    enabledByDefault: true,
    capabilities: {
        realtime: false,
        search: true,
        limits: 'RSS feeds only; respects robots.txt; no full-site scraping.',
    },
    async run() {
        const mentions = [];
        const errors = [];
        for (const feed of RSS_FEEDS) {
            try {
                const items = await fetchFeed(feed);
                for (const item of items) {
                    mentions.push(normalizeItem(item, feed.name));
                }
            } catch (err) {
                errors.push(err);
            }
        }
        if (!mentions.length && errors.length) {
            throw errors[0];
        }
        return mentions;
    },
};

export default localNewsConnector;
