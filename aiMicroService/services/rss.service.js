import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const RSS_FEEDS = [
    {
        name: 'The Kathmandu Post',
        url: 'https://kathmandupost.com/rss',
    },
    {
        name: 'The Himalayan Times',
        url: 'https://thehimalayantimes.com/feed',
    },
    {
        name: 'Republica',
        url: 'https://myrepublica.nagariknetwork.com/rss',
    },
    {
        name: 'Onlinekhabar',
        url: 'https://english.onlinekhabar.com/feed',
    },
];

const parser = new XMLParser({
    ignoreAttributes: false,
});

const normalizeItems = (items, sourceName) => {
    if (!items) return [];
    const list = Array.isArray(items) ? items : [items];
    return list.map((item) => ({
        title: item?.title || '',
        description: item?.description || item?.summary || '',
        url: item?.link || '',
        source: sourceName,
        publishedAt: item?.pubDate || item?.published || item?.['dc:date'] || '',
        image: item?.enclosure?.['@_url'] || '',
    }));
};

export const fetchRssNews = async (query) => {
    const results = await Promise.all(
        RSS_FEEDS.map(async (feed) => {
            try {
                const response = await fetch(feed.url);
                if (!response.ok) {
                    return [];
                }
                const xml = await response.text();
                const parsed = parser.parse(xml);
                const channel = parsed?.rss?.channel || parsed?.feed;
                const items = channel?.item || channel?.entry;
                return normalizeItems(items, feed.name);
            } catch (err) {
                return [];
            }
        })
    );

    const flattened = results.flat();
    const loweredQuery = query.toLowerCase();

    return flattened.filter((item) => {
        const title = (item.title || '').toLowerCase();
        const description = (item.description || '').toLowerCase();
        return title.includes(loweredQuery) || description.includes(loweredQuery);
    });
};
