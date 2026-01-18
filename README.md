This is the Nexus web UI (Next.js App Router). It connects to the backend API over HTTP and SSE.

## Getting Started

### Environment variables

Create a `.env.local` in `designdemo/`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
# Optional auth headers if your backend expects them
# NEXT_PUBLIC_API_KEY=your-api-key
# NEXT_PUBLIC_AUTH_TOKEN=your-bearer-token
```

### Run both apps locally

Backend (AI-Cloud) runs on port 3000:

```bash
cd AI-Cloud
npm install
npm run dev
```

Frontend (designdemo) runs on port 3001:

```bash
cd designdemo
npm install
set PORT=3001 && npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

### Switching to Vercel staging

Set `NEXT_PUBLIC_API_BASE_URL` to your deployed backend base URL:

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-backend-staging.vercel.app
```

### Notes

- The chat endpoint uses `POST /api/chat/turn` with SSE streaming.
- The frontend reads `response.body` as a stream and parses `event:` / `data:` frames.
- The UI never calls relative `/api/*`; all requests go through `NEXT_PUBLIC_API_BASE_URL`.
