import fetch from 'node-fetch';

const API_BASE = 'https://www.googleapis.com/youtube/v3';

const fetchJson = async (url) => {
    const res = await fetch(url, { timeout: 15_000 });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`YouTube API failed: ${res.status} ${text}`);
    }
    return res.json();
};

const youtubeConnector = {
    id: 'youtube',
    displayName: 'YouTube',
    enabledByDefault: true,
    capabilities: {
        realtime: false,
        search: true,
        limits: 'Requires API key; comments limited to top threads.',
    },
    async run({ project }) {
        const apiKey = process.env.YOUTUBE_API_KEY;
        if (!apiKey) {
            throw new Error('Missing YOUTUBE_API_KEY');
        }
        const query = project.keywords.join(' ') || project.booleanQuery || project.name;
        const searchUrl = `${API_BASE}/search?part=snippet&type=video&maxResults=5&q=${encodeURIComponent(
            query
        )}&key=${apiKey}`;
        const searchData = await fetchJson(searchUrl);
        const videoIds = (searchData.items || []).map((item) => item.id.videoId).filter(Boolean);
        if (!videoIds.length) return [];

        const videosUrl = `${API_BASE}/videos?part=snippet,statistics&id=${videoIds.join(
            ','
        )}&key=${apiKey}`;
        const videosData = await fetchJson(videosUrl);

        return (videosData.items || []).map((video) => ({
            source: 'youtube',
            title: video.snippet?.title || '',
            text: video.snippet?.description || '',
            author: video.snippet?.channelTitle || '',
            url: `https://www.youtube.com/watch?v=${video.id}`,
            publishedAt: video.snippet?.publishedAt || null,
            engagement: {
                likes: Number(video.statistics?.likeCount || 0),
                comments: Number(video.statistics?.commentCount || 0),
                shares: 0,
            },
            followerCount: 0,
        }));
    },
};

export default youtubeConnector;
