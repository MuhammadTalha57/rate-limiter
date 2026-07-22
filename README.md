# Rate Limiter Service

A standalone, network-callable rate limiting service. Other applications enforce limits by calling `POST /check` over HTTP and acting on the response — they never import this code directly.

## Why a standalone service instead of a middleware library

Most rate limiters (e.g. `express-rate-limit`) are embedded directly into the app they protect. This one is deliberately architected as a separate deployable service instead, so that:
- Multiple independent applications can share one rate-limiting authority instead of each maintaining separate in-process state.
- It composes naturally with a future API Gateway, which can call this service once per proxied request rather than every backend service reimplementing its own limiting logic.
- The trade-off: every check now costs a network round trip instead of an in-process function call. This service accepts that cost deliberately, in exchange for centralized, consistent limits across many callers.

## How a caller integrates this

This service has no knowledge of anyone else's routes. A consuming application writes its own middleware that calls this service and reacts to the result:

```ts
// lives in the CALLING application, not here
async function rateLimitMiddleware(req, res, next) {
  const response = await fetch('http://rate-limiter.internal/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key: `myapp:${req.user.id}:${req.path}` }),
  });
  const { allowed } = await response.json();
  if (!allowed) return res.status(429).json({ error: 'rate limited' });
  next();
}
```

## API

### `POST /check`

**Request body**
```json
{
  "key": "myapp:user_123",
  "overrides": {
    "algorithm": "tokenBucket",
    "tokenBucket": { "capacity": 100, "refillRate": 10 },
    "slidingWindow": { "windowSize": 60000, "maxRequests": 100 }
  }
}
```
- `key` (required) — the identity being rate-limited. The caller decides the namespacing (per-user, per-IP, per-route, or a composite) by constructing this string; the service itself has no concept of routes or users.
- `overrides` (optional) — per-request configuration. Any field omitted falls back to the server's default config (see [Configuration](#configuration)). This lets different callers request different limits from the same running service without the service needing to know about them in advance.

**Response**
```json
{ "allowed": true }
```
`400` if `key` is missing.

### `GET /health`
Returns `{ "ok": true }` (200) or `{ "ok": false }` (503). When `STORE_TYPE=Redis`, this also pings Redis and reports unhealthy if unreachable. In memory mode, it reports service health only — it does not depend on Redis being configured or reachable.

## Architecture

```
Request → routes/check.route.ts → controllers/check.controller.ts
            → services/rateLimiter.service.ts (merges request overrides with defaults)
              → repositories/{memory,redis}Store.repository.ts (Store interface)
```

**Composition root**: `app.ts` constructs the store and the rate limiter exactly once, at process boot — not per-request. `STORE_TYPE` (env var) decides whether `MemoryStore` or `RedisStore` gets built; nothing else in the codebase needs to know which one is active.

**Why algorithms live inside the `Store` implementations, not in a shared service layer**: an earlier version of this service put the token bucket / sliding window math in one shared function that took an injected store. That fell apart at the concurrency layer — the two stores need to guarantee atomicity in fundamentally different ways (see below), and forcing both through one generic interface hid that difference instead of expressing it. `MemoryStore` and `RedisStore` each implement `checkWithTokenBucket` and `checkWithSlidingWindow` directly, so each store owns the concurrency strategy that's actually correct for its storage medium.

## Concurrency & atomicity — the actual point of this service

A rate limiter that isn't correct under concurrent requests isn't a rate limiter — it's a suggestion. Both storage backends had a real race condition during development, and both were fixed differently, deliberately:

**In-memory store**: Node's single-threaded event loop means a synchronous read-modify-write inside one `async` function body — with no `await` between the read and the write — cannot be interleaved by another request. Correctness here relies on this guarantee, not on any explicit locking.

**Redis store**: a naive `GET` → compute → `SET` sequence across two separate network round trips *is* racy — two concurrent requests can both read the same starting value before either writes back, letting more requests through than the configured limit. Fixed by moving the entire check into a **Lua script executed via `EVAL`**, which Redis guarantees runs atomically end-to-end, with no other command interleaving partway through — even though the script itself performs multiple reads and writes internally.
- **Token bucket** (`redisTokenBucket.script.lua`) stores `{tokens, lastUpdated}` as a JSON string, refills based on elapsed time, and decrements — all inside one atomic script.
- **Sliding window** (`redisSlidingWindow.script.lua`) uses a Redis **sorted set** (`ZSET`) instead of a JSON array, scoring each request by timestamp. `ZREMRANGEBYSCORE` expires old entries and `ZCARD` counts the window in native Redis operations, avoiding repeated JSON parse/stringify of a growing array on every call.

## Algorithms

**Token bucket** — a bucket holds up to `capacity` tokens, refilling at `refillRate` tokens/second. Each request consumes one token if available. Allows short bursts up to full capacity, then throttles to the steady refill rate.

**Sliding window log** — keeps exact timestamps of requests within the last `windowSize` milliseconds; a request is allowed if fewer than `maxRequests` timestamps fall in that window. More precise than a fixed window (no boundary-reset burst exploit), at the cost of storing more state per key.

## Getting started

### Local (no Docker)
```bash
npm install
cp .env.example .env   # fill in Upstash credentials if using STORE_TYPE=Redis
npm run dev
```

### Docker
```bash
docker compose up --build
```
Environment variables are injected at container **runtime** via `env_file` in `docker-compose.yml`, reading your local `.env` — the file itself is never copied into the image (excluded via `.dockerignore`), so credentials never end up baked into an image layer.

### Example request
```bash
curl -X POST http://localhost:3000/check \
  -H "Content-Type: application/json" \
  -d '{"key":"test-user"}'
```

## Configuration

| Variable | Description | Default |
|---|---|---|
| `PORT` | HTTP port | `3000` |
| `STORE_TYPE` | `Memory` or `Redis` | `Memory` |
| `UPSTASH_REDIS_REST_URL` | Upstash REST endpoint (required if `STORE_TYPE=Redis`) | — |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash REST token (required if `STORE_TYPE=Redis`) | — |
| `LOG_LEVEL` | `pino` log level | `info` (dev: `debug`) |

Server-side default limits (overridable per-request, see [API](#api)):

| Algorithm | Default |
|---|---|
| Token bucket | capacity `100`, refill `10`/sec |
| Sliding window | `100` requests / `60000`ms |

## Testing

```bash
npm test
```
- **Unit tests** (`tests/unit/`) exercise the token bucket and sliding window logic directly, isolated from Express and from the network.
- **Integration tests** (`tests/integration/`) use Supertest against the exported Express `app` object in-process — no server listens on a port during tests; Supertest simulates HTTP requests directly against the app's request handler.

## Load testing

**Throughput** — Postman, 50 concurrent virtual users, 1 minute, against `POST /check`:

| Metric | Result |
|---|---|
| Total requests | 21,800 |
| Requests/sec (avg) | 364.6 |
| Avg response time | 39 ms |
| P90 / P95 / P99 | 38 ms / 55 ms / 203 ms |
| Max response time | 6,661 ms |
| Error rate | 0.00% |
| Failure rate | 0.00% |

A separate local run via `autocannon` (10s, 50 connections) showed comparable throughput (1,681 req/sec avg) at low double-digit millisecond median latency, with tail latency spiking under sustained max concurrency — consistent with the Postman run's P99.

**What this confirms**: the service stays up, responds without errors, and holds reasonable latency under concurrent load from a single-machine test client.

## Known limitations / not yet done

- No authentication on `/check` — this is a trusted-internal-service model (any caller that can reach it can query any key with any override). Acceptable for an internal service behind a gateway/VPC; would need an API-key or mTLS layer before being exposed publicly.
- No per-caller/tenant policy store (e.g. "user X always gets capacity Y") — config is either server-side defaults or supplied per-request by the caller. A policy-lookup layer is a plausible future extension, likely once an Auth service exists to anchor identity.
- Fixed-window and leaky-bucket algorithms are not implemented — token bucket and sliding window log cover the two most commonly asked-about strategies for this stage of the curriculum.

## Tech stack

TypeScript, Express, Vitest + Supertest, Upstash Redis (REST-based, serverless-friendly), Pino (structured logging), Docker (multi-stage build), GitHub Actions (lint + test + build on push).
