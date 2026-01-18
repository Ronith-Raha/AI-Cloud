# AI-Cloud Backend
Next.js (App Router) backend service for a multi-provider chat gateway with shared memory, graph indexing, and transparency endpoints. This repo contains **API-only** routes and no UI; frontend apps should call these endpoints over HTTP/SSE.

## Local Development
1. Install dependencies:
   - `npm install`
2. Create a `.env` from `.env.example` and fill in values.
3. Run migrations:
   - `npm run db:migrate`
4. Start the dev server:
   - `npm run dev`

## Migrations (Drizzle)
- Generate a new migration after schema changes:
  - `npm run db:generate`
- Apply migrations:
  - `npm run db:migrate`

## Environment Variables
See `.env.example` for required variables:
- `DATABASE_URL`
- `ZEP_API_KEY`
- `ZEP_API_URL` (optional)
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- `TOKENCO_API_KEY` (optional, The Token Company compression)

## Frontend Reference (Detailed, Non‑Prescriptive)

### Core Concepts
- **Project**: Container for all turns, nodes, and Zep thread mapping. All requests are scoped by `projectId`.
- **Turn**: A single user + assistant exchange. Stored in `turns`, includes `injectedContextText`.
- **Node**: A visual representation of a turn in the graph (`viz_nodes`).
- **Edge**: A relationship between nodes (`viz_edges`). MVP uses only `follows`.
- **Injected Context**: The exact context string the model received.
- **Zep Context**: Context block returned by Zep and embedded in injected context.

### Endpoint Semantics
- `POST /api/projects`: creates a project, returns `{ projectId }`.
- `GET /api/projects`: returns list of projects for `userId="dev"`.
- `POST /api/chat/turn` (SSE):
  - `token` events stream partial assistant text deltas.
  - `complete` event includes `turnId` and `nodeId` (persistence finished).
  - `error` event includes `{ code, message }` (no persistence).
- `GET /api/chat/turn/:turnId/injected`: returns injected context for a turn.
- `GET /api/graph/view`: returns `{ level, nodes, edges }` filtered to non‑deleted nodes.
- `GET /api/graph/node/:nodeId`: returns node details + linked turn text.
- `POST /api/graph/node/:nodeId/edit`: updates title/summary/pinned and marks `user_edited`.
- `POST /api/graph/node/:nodeId/delete`: soft‑deletes a node.
- `POST /api/graph/node/:nodeId/restore`: restores a node.

### SSE Event Shapes
- `token`: `{"text":"..."}` incremental delta
- `complete`: `{"turnId":"...","nodeId":"..."}`
- `error`: `{"code":"...","message":"..."}`

### Data Shapes (High‑Level)
- **Project**: `{ id, name, createdAt }`
- **Turn**: `{ id, projectId, provider, model, userText, assistantText, injectedContextText, createdAt, ... }`
- **Node**: `{ id, projectId, turnId, title, summary2sent, pinned, userEdited, deletedAt, createdAt, updatedAt }`
- **Edge**: `{ id, projectId, srcNodeId, dstNodeId, relType, weight }`

### Graph Interpretation
- `relType="follows"` implies a sequential timeline.
- `pinned=true` nodes are injected into future context under “Pinned Context”.
- `deletedAt` marks soft deletion; deleted nodes are excluded from graph view and pinned context.

### Error Surface
- Non‑SSE endpoints return JSON errors `{ code, message }`.
- SSE streams emit `event: error` with `{ code, message }`, and the stream closes.

### Provider/Model Behavior
- `provider` is one of `openai | anthropic | gemini`.
- `model` is passed through to the provider SDK as‑is.
- The summarizer uses the same provider/model for consistency.

## Zep Integration Notes
- Zep is integrated via the official `@getzep/zep-cloud` SDK.
- The server creates/ensures a Zep user and thread per project before adding messages.
- Context is fetched with `thread.getUserContext()` and injected verbatim into turns.

## The Zep cross-model test script should be run from the repository root:
- powershell -ExecutionPolicy Bypass -File .\scripts\zep-cross-model-test.ps1




## Curl Examples
Create a project:
```
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{"name":"Demo Project"}'
```

List projects:
```
curl http://localhost:3000/api/projects
```

Stream a chat turn (SSE):
```
curl -N -X POST http://localhost:3000/api/chat/turn \
  -H "Content-Type: application/json" \
  -d '{"projectId":"<projectId>","provider":"openai","model":"gpt-4o-mini","userText":"Hello!"}'
```

Graph view:
```
curl "http://localhost:3000/api/graph/view?projectId=<projectId>&level=0&limit=50"
```

Injected context transparency:
```
curl http://localhost:3000/api/chat/turn/<turnId>/injected
```

## Notes
- Streaming endpoints run on the Node.js runtime (`runtime = "nodejs"`).
- Auth is MVP-only and uses a fixed user id (`dev`) in all handlers.

## Token Company Compression
- If `TOKENCO_API_KEY` is set, the backend compresses the **memory context block** (Pinned Context) before sending to the provider.
- The user’s latest message is **not** compressed.
- The stored `injectedContextText` is the compressed version that the model saw.
