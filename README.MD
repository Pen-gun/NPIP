# Nepal Public Figure Intelligence Platform (NPIP)

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

## Notes

- Connectors are opt-in per project and can be toggled in the project settings.
- Email alerts require SMTP configuration and `ALERT_EMAIL_ENABLED=true`.
- Stripe webhook endpoint is exposed at `/api/v1/stripe/webhook` if enabled.
