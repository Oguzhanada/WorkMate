# WorkMate Public API v1

Base path: `/api/public/v1`

Authentication: send your key in `x-api-key` header.

```http
x-api-key: wm_live_************************
```

Default rate limit is `1000 requests/day` per key (UTC day). Admins can change the limit.

## Endpoints

### GET /jobs

List approved jobs.

Query params:
- `limit` (optional, default `20`, max `100`)
- `offset` (optional, default `0`)
- `status` (optional)
- `county` (optional)
- `category` (optional)

Example:

```bash
curl -X GET "https://workmate.ie/api/public/v1/jobs?county=Cork&limit=10" \
  -H "x-api-key: wm_live_xxx"
```

### GET /jobs/{id}

Get one approved job by id.

```bash
curl -X GET "https://workmate.ie/api/public/v1/jobs/3a6f..." \
  -H "x-api-key: wm_live_xxx"
```

### GET /providers

List verified providers.

Query params:
- `limit` (optional, default `20`, max `100`)
- `offset` (optional, default `0`)
- `q` (optional, provider name search)
- `county` (optional, exact county filter)
- `category_id` (optional, category UUID filter)

```bash
curl -X GET "https://workmate.ie/api/public/v1/providers?county=Cork" \
  -H "x-api-key: wm_live_xxx"
```

### POST /webhooks/subscribe

Create a webhook subscription for the API key owner.

Body:

```json
{
  "url": "https://example.com/workmate/webhook",
  "events": ["job.created", "quote.accepted"]
}
```

Rules:
- URL must be `https://`.
- `signing_secret` is returned once. Store it securely.

```bash
curl -X POST "https://workmate.ie/api/public/v1/webhooks/subscribe" \
  -H "Content-Type: application/json" \
  -H "x-api-key: wm_live_xxx" \
  -d '{"url":"https://example.com/workmate/webhook","events":["job.created"]}'
```

### DELETE /webhooks/subscribe/{id}

Delete one of your subscriptions.

```bash
curl -X DELETE "https://workmate.ie/api/public/v1/webhooks/subscribe/2d9c..." \
  -H "x-api-key: wm_live_xxx"
```

## Webhook Delivery

WorkMate sends JSON payloads with these headers:
- `X-WorkMate-Event`
- `X-WorkMate-Timestamp`
- `X-WorkMate-Signature` (`sha256=<hex>`)

Signature base string:

```text
${timestamp}.${rawBody}
```

Hash algorithm: `HMAC-SHA256(signing_secret, baseString)`.

Retries:
- Best-effort retries on transient failures (`429`, `5xx`, network timeout).

## Common Errors

- `401`: missing/invalid API key.
- `429`: daily limit exceeded.
- `400`: invalid request body or query.
- `404`: record not found.
