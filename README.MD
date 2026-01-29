9# Nepal Public Figure Intelligence Platform (NPIP)

NPIP is a public-figure intelligence console focused on Nepal. It collects public signals, normalizes
mentions, and presents dashboards with identity, news, sentiment, and alerts.

## What It Does

- Confirms identity using Wikipedia with disambiguation handling
- Aggregates news and social mentions across multiple connectors
- Deduplicates and enriches mentions with sentiment, language, reach
- Streams alerts and live updates via WebSocket
- Generates PDF reports for projects

## Architecture (High Level)

- Frontend (React + Vite) consumes the API and subscribes to Socket.IO
- Backend (Node + Express) exposes REST endpoints and runs a scheduler
- MongoDB stores users, projects, mentions, alerts, and usage

## Tech Stack

- Backend: Node.js, Express, MongoDB (Mongoose), Socket.IO
- Frontend: React, Vite, TypeScript, React Query, Tailwind, Chart.js
- External data: Wikipedia REST API, GNews, RSS, YouTube, social connectors

## Quick Start

```bash
# Backend
cd Backend
cp ai.env.example ai.env
npm install
npm run dev

# Frontend
cd ../Frontend
npm install
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:8000

## Configuration

Backend environment variables are in `Backend/ai.env`.
Frontend environment variables are in `Frontend/.env`.

## Data Flow (Summary)

1) User creates a project with keywords and sources
2) Scheduler runs connectors and pulls mentions on a cadence
3) Mentions are enriched (sentiment/lang/reach) and stored
4) Alerts are emitted for spikes and new mentions
5) Frontend fetches metrics/mentions and listens for realtime updates

## Repo Layout

```
NPIP/
  Backend/      # Express API, scheduler, connectors, Mongo models
  Frontend/     # React UI
```

## API At A Glance

- Health: `GET /health`
- Figures: `GET /api/v1/figures/identity|news|videos|search`
- Auth: `POST /api/v1/auth/*`
- Projects: `GET|POST|PATCH /api/v1/projects`
- Mentions: `GET /api/v1/mentions`
- Alerts: `GET /api/v1/alerts`
- Reports: `GET /api/v1/reports/:id`

## Mentions System

The mentions system is the core of NPIP, aggregating and analyzing public signals about tracked figures.

### Mention Data Structure

Each mention contains:
- **Content**: Title, snippet, full text, URL, and media attachments
- **Source**: Platform (YouTube, Reddit, X, Meta, TikTok, News, RSS)
- **Author**: Username, display name, follower count, profile URL
- **Timestamps**: Published date, ingested date, last updated
- **Engagement**: Likes, comments, shares, views, reach estimate
- **Sentiment**: Label (positive/neutral/negative), confidence score
- **Language**: Detected language code and confidence
- **Location**: Geo-tagged location if available (province/district for Nepal)

### Mention Endpoints

```
GET /api/v1/mentions
  ?projectId=     # Required: Filter by project
  ?source=        # Optional: Filter by source (youtube, reddit, x, meta, news, etc.)
  ?sentiment=     # Optional: Filter by sentiment (positive, neutral, negative)
  ?startDate=     # Optional: Start of date range (ISO 8601)
  ?endDate=       # Optional: End of date range (ISO 8601)
  ?search=        # Optional: Full-text search in title/snippet
  ?author=        # Optional: Filter by author name
  ?page=          # Optional: Page number (default: 1)
  ?limit=         # Optional: Items per page (default: 20, max: 100)
  ?sort=          # Optional: Sort field (newest, oldest, reach, engagement)
```

### Response Format

```json
{
  "success": true,
  "data": {
    "mentions": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalCount": 1250,
      "totalPages": 63
    }
  }
}
```

### Mention Sources

| Source | Connector | Data Collected |
|--------|-----------|----------------|
| YouTube | youtube.connector.js | Videos, comments, transcripts |
| Reddit | reddit.connector.js | Posts, comments from relevant subreddits |
| X (Twitter) | x.connector.js | Tweets, retweets, replies |
| Meta | meta.connector.js | Facebook posts, Instagram posts |
| TikTok | tiktok.connector.js | Videos, comments |
| News | localNews.connector.js | Nepali news articles |
| RSS | rss.service.js | Custom RSS feed articles |

### Mention Processing Pipeline

1. **Collection**: Connectors fetch raw data from APIs
2. **Deduplication**: URL-based deduplication prevents duplicates
3. **Enrichment**: 
   - Sentiment analysis via ML model
   - Language detection
   - Reach estimation based on source metrics
4. **Storage**: Mentions saved to MongoDB with full indexing
5. **Alerting**: Spike detection triggers real-time alerts
6. **Streaming**: New mentions pushed via Socket.IO

## Notes
- Connectors are opt-in per project and can be toggled in the project settings.
- Email alerts require SMTP configuration and `ALERT_EMAIL_ENABLED=true`.