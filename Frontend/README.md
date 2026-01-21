# NPIP Frontend

React UI for the NPIP platform. It renders dashboards, figures, mentions, and metrics, and listens
for realtime alerts from the backend.

## Local Development

```bash
npm install
npm run dev
```

App: http://localhost:5173

## Environment Variables

`Frontend/.env`
- `VITE_API_URL` (default `/api/v1`)
- `VITE_SOCKET_URL` (optional; empty uses same origin)

## Key Libraries

- React + TypeScript
- React Query for data fetching
- Axios for HTTP
- Socket.IO client for realtime updates
- Tailwind + Chart.js for UI and charts

## Structure (High Level)

```
src/
  api/         # API clients
  components/  # UI components
  contexts/    # Auth + global state
  hooks/       # Shared hooks
  pages/       # Route-level pages
  types/       # TypeScript types
```

## Runtime Flow (Summary)

1) User signs in, context stores session
2) Dashboard loads metrics/mentions via REST
3) Socket.IO subscribes to user/project rooms
4) New alerts update the UI in realtime

## Scripts

- `npm run dev` starts Vite dev server
- `npm run build` builds for production
- `npm run lint` runs ESLint
- `npm run preview` serves the production build
