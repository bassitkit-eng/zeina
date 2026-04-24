# Zeina Worker (R2 upload + cleanup)

This worker supports:
- `POST /` upload image to R2.
- `POST /delete` delete one image from R2 by `storagePath`.
- `POST /cleanup` process `public.r2_deletion_queue` from Supabase and delete files from R2.
- `GET /objects/{storagePath}` serve image from R2 (fallback public URL).

## Required secrets

Set service role key:

```bash
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Optional secret to protect cleanup endpoint:

```bash
wrangler secret put CLEANUP_SECRET
```

## Deploy

```bash
cd cloudflare/zeina-api
wrangler deploy
```

## Manual cleanup trigger

```bash
curl -X POST "https://zeina-api.zeinaevents-eg.workers.dev/cleanup" \
  -H "Content-Type: application/json" \
  -H "x-cleanup-secret: <your-secret-if-set>" \
  -d '{"limit":100}'
```

Expected response:

```json
{ "success": true, "processed": 10, "deleted": 10, "failed": 0 }
```
