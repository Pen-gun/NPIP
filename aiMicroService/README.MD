# NPIP Backend (MVP)

Simple Express service for the Nepal Public Figure Intelligence Platform (NPIP).

## Setup

1. `cp ai.env.example ai.env`
2. Fill `GNEWS_API_KEY` (optional but recommended).
3. `npm install`
4. `npm run dev`

Backend runs on `http://localhost:8000` by default.

## Configuration

- `GNEWS_API_KEY`: optional, enables verified news headlines
- `NEWS_LIMIT`: optional, default 5
- `WIKI_LIMIT`: optional, default 5

## Endpoints

`GET /health`

`GET /api/v1/figures/search?query=KP%20Oli`

Response:

```json
{
  "query": "KP Oli",
  "person": {
    "name": "K. P. Sharma Oli",
    "description": "Prime Minister of Nepal",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/K._P._Sharma_Oli",
    "thumbnail": "https://upload.wikimedia.org/...",
    "extract": "Khadga Prasad Sharma Oli ...",
    "pageId": 12345
  },
  "recentActivities": [
    {
      "title": "Headline...",
      "publishedAt": "2025-01-01T00:00:00Z",
      "source": "Source name",
      "url": "https://..."
    }
  ],
  "news": [],
  "metadata": {
    "newsProvider": "gnews",
    "warning": null
  }
}
```
