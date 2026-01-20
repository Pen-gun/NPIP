# Nepal Public Figure Intelligence Platform (NPIP)

NPIP is an intelligence console that delivers verified, real-time context on Nepali public figures. 
Search a name and get identity confirmation, latest activities, verified news, and a clean timeline.

## MVP Features

- Public figure search (Wikipedia identity resolution)
- Latest news feed (GNews API)
- Activity highlights and timeline view
- Simple, fast UI for researchers and journalists

## Tech Stack

- Backend: Node.js + Express
- Frontend: React + Vite
- Data: Wikipedia REST API, GNews API

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

## API

`GET /api/v1/figures/search?query=KP%20Oli`

Returns:

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
  "recentActivities": [],
  "news": [],
  "metadata": {
    "newsProvider": "gnews",
    "warning": null
  }
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

- Intermediate: disambiguation flows, multi-source aggregation, timeline deduplication, sentiment
- Advanced: microservices, queues, Redis cache, elastic search, role-based dashboards

## Ethics & Compliance

- Public data only
- Source transparency on every output
- No private or leaked information
