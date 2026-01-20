# NPIP MVP Plan

## Folder Structure

```
NPIP/
  aiMicroService/
    controllers/
    routes/
    services/
    server.js
    app.js
  Frontend/
    src/
      App.tsx
      App.css
      index.css
      main.tsx
```

## API Routes

- `GET /api/v1/figures/search?query=...`
  - Returns identity profile + recent news + activity timeline.
- `GET /health`
  - Health check.

## Database Schema (optional for MVP)

```
public_figures
- _id
- name
- aliases[]
- wikipediaUrl
- description
- lastFetchedAt

news_cache
- _id
- figureId
- title
- url
- source
- publishedAt
- summary
- createdAt
```

## Step-by-step Implementation

1. Build search endpoint that queries Wikipedia and returns a verified profile.
2. Add a news service wrapper (GNews) and attach recent headlines.
3. Normalize output format (person + news + recentActivities).
4. Build a clean React UI that calls the endpoint and renders the results.
5. Add caching and disambiguation as the next upgrade.
