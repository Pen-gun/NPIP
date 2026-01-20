import fetch from 'node-fetch';

const WIKI_SEARCH_URL = 'https://en.wikipedia.org/w/rest.php/v1/search/title';
const WIKI_SUMMARY_URL = 'https://en.wikipedia.org/api/rest_v1/page/summary/';

const normalizeTitle = (title) => encodeURIComponent(title.replace(/ /g, '_'));

export const fetchWikiProfile = async (query, limit = 5) => {
    const resolvedLimit = Number(process.env.WIKI_LIMIT) || limit;
    const searchUrl = `${WIKI_SEARCH_URL}?q=${encodeURIComponent(query)}&limit=${resolvedLimit}`;
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
        throw new Error('Failed to search Wikipedia');
    }

    const searchData = await searchResponse.json();
    const bestMatch = searchData?.pages?.[0];

    if (!bestMatch?.title) {
        return null;
    }

    const summaryUrl = `${WIKI_SUMMARY_URL}${normalizeTitle(bestMatch.title)}`;
    const summaryResponse = await fetch(summaryUrl);

    if (!summaryResponse.ok) {
        return {
            name: bestMatch.title,
            description: bestMatch.description || '',
            wikipediaUrl: bestMatch?.content_urls?.desktop?.page || '',
            thumbnail: bestMatch?.thumbnail?.url || '',
            extract: '',
        };
    }

    const summaryData = await summaryResponse.json();

    return {
        name: summaryData?.title || bestMatch.title,
        description: summaryData?.description || bestMatch.description || '',
        wikipediaUrl: summaryData?.content_urls?.desktop?.page || '',
        thumbnail: summaryData?.thumbnail?.source || '',
        extract: summaryData?.extract || '',
        pageId: summaryData?.pageid || null,
    };
};
