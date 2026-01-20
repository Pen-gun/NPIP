# Nepal Public Figure Intelligence Platform (NPIP)

NPIP is a public-figure intelligence console for Nepal. Search a person and get verified identity,
deduplicated timelines, trusted news, interviews, and quick signals.

## What This Does Today

- Identity confirmation via Wikipedia (with disambiguation support)
- Multi-source news aggregation (GNews + RSS)
- Timeline deduplication + relevance filtering
- Recent activity highlights
- YouTube interviews/speeches
- Location signals from the last 24 hours (heuristic from headlines)
- Progressive loading: identity first, then news/videos

## Tech Stack

- Backend: Node.js + Express
- Frontend: React + Vite + React Query
- Data: Wikipedia REST API, GNews API, RSS feeds, YouTube Data API

## Quick Start

```bash
# Backend
cd aiMicroService
cp ai.env.example ai.env
npm install
npm run dev

# Frontend
cd ../Frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`  
Backend: `http://localhost:8000`

## Configuration

Set API keys in `aiMicroService/ai.env`:

- `GNEWS_API_KEY` (optional but recommended)
- `YOUTUBE_API_KEY` (optional)
- `CACHE_TTL_MS` (default 600000)

## API Overview

Identity first, then load sections progressively:

- `GET /api/v1/figures/identity?query=KP%20Oli`
- `GET /api/v1/figures/news?name=K.%20P.%20Sharma%20Oli&query=KP%20Oli&aliases=K.%20P.%20Sharma%20Oli`
- `GET /api/v1/figures/videos?name=K.%20P.%20Sharma%20Oli`

Legacy combined endpoint (still supported):

- `GET /api/v1/figures/search?query=KP%20Oli`

## Response Shapes (Short)

Identity:

```json
{
  "query": "KP Oli",
  "person": {
    "name": "K. P. Sharma Oli",
    "description": "Prime Minister of Nepal",
    "wikipediaUrl": "https://en.wikipedia.org/wiki/K._P._Sharma_Oli",
    "thumbnail": "https://upload.wikimedia.org/...",
    "extract": "Khadga Prasad Sharma Oli ...",
    "pageId": 12345,
    "aliases": ["K. P. Sharma Oli"]
  },
  "candidates": [],
  "isDisambiguation": false
}
```

News:

```json
{
  "query": "KP Oli",
  "name": "K. P. Sharma Oli",
  "recentActivities": [],
  "recentLocations": [],
  "news": [],
  "metadata": { "newsProvider": "gnews+rss", "warning": null }
}
```

Videos:

```json
{
  "name": "K. P. Sharma Oli",
  "videos": [],
  "metadata": { "warning": null }
}
```

## Folder Structure

```
NPIP/
  aiMicroService/     # Express API
    controllers/
    routes/
    services/
  Frontend/           # React UI
    src/
```

## Roadmap

- Better entity matching (aliases + exact phrase match)
- Named entity extraction for locations + events
- Source confidence scoring
- Scheduled background refreshes + storage
- Role-based dashboards and alerts

## Ethics & Compliance

- Public data only
- Source transparency on every output
- No private or leaked information
