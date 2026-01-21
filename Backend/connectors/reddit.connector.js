import fetch from 'node-fetch';

const SUBREDDITS = ['Nepal', 'NepalPolitics', 'Nepali', 'NepalSocial'];

const fetchJson = async (url) => {
    const res = await fetch(url, { timeout: 15_000, headers: { 'User-Agent': 'NPIP/1.0' } });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Reddit API failed: ${res.status} ${text}`);
    }
    return res.json();
};

const redditConnector = {
    id: 'reddit',
    displayName: 'Reddit (r/Nepal)',
    enabledByDefault: true,
    capabilities: {
        realtime: false,
        search: true,
        limits: 'Public search JSON; no private communities.',
    },
    async run({ project }) {
        const query = project.keywords.join(' ') || project.booleanQuery || project.name;
        const mentions = [];
        for (const subreddit of SUBREDDITS) {
            const url = `https://www.reddit.com/r/${subreddit}/search.json?q=${encodeURIComponent(
                query
            )}&restrict_sr=1&sort=new&limit=10`;
            const data = await fetchJson(url);
            const posts = data?.data?.children || [];
            for (const item of posts) {
                const post = item.data || {};
                mentions.push({
                    source: 'reddit',
                    title: post.title || '',
                    text: post.selftext || '',
                    author: post.author || '',
                    url: `https://www.reddit.com${post.permalink || ''}`,
                    publishedAt: post.created_utc ? new Date(post.created_utc * 1000) : null,
                    engagement: {
                        likes: post.ups || 0,
                        comments: post.num_comments || 0,
                        shares: 0,
                    },
                    followerCount: 0,
                });
            }
        }
        return mentions;
    },
};

export default redditConnector;
