import { TwitterApi } from 'twitter-api-v2';

const xConnector = {
    id: 'x',
    displayName: 'X (Twitter)',
    enabledByDefault: false,
    capabilities: {
        realtime: false,
        search: true,
        limits: 'Requires paid API access; v2 recent search only.',
    },
    async run({ project }) {
        const bearerToken = process.env.TWITTER_BEARER_TOKEN;
        if (!bearerToken) {
            throw new Error('Missing TWITTER_BEARER_TOKEN');
        }
        const client = new TwitterApi(bearerToken);
        const query = project.keywords.join(' ') || project.booleanQuery || project.name;
        const results = await client.v2.search(query, { max_results: 10 });
        const mentions = [];
        for (const tweet of results.data || []) {
            mentions.push({
                source: 'x',
                title: '',
                text: tweet.text || '',
                author: tweet.author_id || '',
                url: `https://twitter.com/i/web/status/${tweet.id}`,
                publishedAt: tweet.created_at || null,
                engagement: { likes: 0, comments: 0, shares: 0 },
                followerCount: 0,
            });
        }
        return mentions;
    },
};

export default xConnector;
