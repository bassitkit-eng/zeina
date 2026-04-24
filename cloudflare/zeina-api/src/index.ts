export interface Env {
  PRODUCT_IMAGES: R2Bucket
  SUPABASE_URL: string
  SUPABASE_SERVICE_ROLE_KEY: string
  R2_PUBLIC_BASE_URL?: string
  CLEANUP_SECRET?: string
}

type CleanupRow = {
  id: string
  storage_path: string
}

type CleanupResult = {
  processed: number
  deleted: number
  failed: number
}

function normalizeStoragePath(raw: string): string {
  let value = (raw || '').trim()
  if (!value) return ''

  try {
    if (value.startsWith('http://') || value.startsWith('https://')) {
      const parsed = new URL(value)
      const objectSegment = '/objects/'
      if (parsed.pathname.includes(objectSegment)) {
        value = parsed.pathname.split(objectSegment)[1] || ''
      } else {
        value = parsed.pathname.replace(/^\/+/, '')
      }
    }
    value = decodeURIComponent(value)
  } catch {
    // Keep best-effort original value
  }

  return value.replace(/^\/+/, '').trim()
}

function withCorsHeaders(headers?: HeadersInit): Headers {
  const next = new Headers(headers)
  next.set('Access-Control-Allow-Origin', '*')
  next.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  next.set('Access-Control-Allow-Headers', 'Content-Type,x-cleanup-secret')
  return next
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: withCorsHeaders({ 'Content-Type': 'application/json; charset=utf-8' }),
  })
}

function normalizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

function getImageUrl(request: Request, env: Env, storagePath: string): string {
  const base = (env.R2_PUBLIC_BASE_URL || '').trim()
  if (base) return `${base.replace(/\/$/, '')}/${storagePath}`
  return `${new URL(request.url).origin}/objects/${encodeURIComponent(storagePath)}`
}

async function uploadImage(request: Request, env: Env): Promise<Response> {
  const form = await request.formData()
  const file = form.get('file')
  const userId = String(form.get('userId') || '').trim()
  const productId = String(form.get('productId') || '').trim()

  if (!(file instanceof File)) return json({ success: false, message: 'file is required' }, 400)
  if (!userId) return json({ success: false, message: 'userId is required' }, 400)
  if (!productId) return json({ success: false, message: 'productId is required' }, 400)

  const safeName = normalizeFileName(file.name || 'image')
  const storagePath = `${userId}/${productId}/${Date.now()}-${safeName}`

  await env.PRODUCT_IMAGES.put(storagePath, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type || 'application/octet-stream',
    },
  })

  return json({
    success: true,
    imageUrl: getImageUrl(request, env, storagePath),
    storagePath,
  })
}

async function deleteImage(request: Request, env: Env): Promise<Response> {
  const body = (await request.json().catch(() => ({}))) as { storagePath?: string }
  const storagePath = normalizeStoragePath(body.storagePath || '')

  if (!storagePath) return json({ success: false, message: 'storagePath is required' }, 400)

  await env.PRODUCT_IMAGES.delete(storagePath)
  return json({ success: true, storagePath })
}

async function fetchPendingFromSupabase(env: Env, limit: number): Promise<CleanupRow[]> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/get_pending_r2_deletions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_limit: limit }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to fetch queue: ${response.status} ${text}`)
  }

  return ((await response.json()) || []) as CleanupRow[]
}

async function markQueueResult(env: Env, rowId: string, success: boolean, error?: string): Promise<void> {
  const response = await fetch(`${env.SUPABASE_URL}/rest/v1/rpc/mark_r2_deletion_result`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ p_id: rowId, p_success: success, p_error: error ?? null }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to mark queue row ${rowId}: ${response.status} ${text}`)
  }
}

async function runCleanup(env: Env, limit = 100): Promise<CleanupResult> {
  const rows = await fetchPendingFromSupabase(env, limit)
  const result: CleanupResult = { processed: rows.length, deleted: 0, failed: 0 }

  for (const row of rows) {
    try {
      const normalizedKey = normalizeStoragePath(row.storage_path)
      if (!normalizedKey) {
        await markQueueResult(env, row.id, false, 'Empty/invalid storage path')
        result.failed += 1
        continue
      }

      await env.PRODUCT_IMAGES.delete(normalizedKey)
      const stillExists = await env.PRODUCT_IMAGES.head(normalizedKey)
      if (stillExists) {
        await markQueueResult(env, row.id, false, `Object still exists after delete attempt: ${normalizedKey}`)
        result.failed += 1
      } else {
        await markQueueResult(env, row.id, true)
        result.deleted += 1
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown cleanup error'
      await markQueueResult(env, row.id, false, message)
      result.failed += 1
    }
  }

  return result
}

function isCleanupAuthorized(request: Request, env: Env): boolean {
  const secret = (env.CLEANUP_SECRET || '').trim()
  if (!secret) return true
  return request.headers.get('x-cleanup-secret') === secret
}

async function serveObject(request: Request, env: Env, pathname: string): Promise<Response> {
  const key = decodeURIComponent(pathname.replace(/^\/objects\//, ''))
  if (!key) return json({ success: false, message: 'Object key is required' }, 400)

  const object = await env.PRODUCT_IMAGES.get(key)
  if (!object) return json({ success: false, message: 'Not found' }, 404)

  const headers = withCorsHeaders()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  return new Response(object.body, { status: 200, headers })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: withCorsHeaders() })

    const { pathname } = new URL(request.url)

    if (request.method === 'GET' && pathname.startsWith('/objects/')) {
      return serveObject(request, env, pathname)
    }

    if (request.method === 'POST' && pathname === '/delete') {
      return deleteImage(request, env)
    }

    if (request.method === 'POST' && pathname === '/cleanup') {
      if (!isCleanupAuthorized(request, env)) return json({ success: false, message: 'Unauthorized' }, 401)

      const body = (await request.json().catch(() => ({}))) as { limit?: number }
      const limit = Math.max(1, Math.min(500, Number(body.limit || 100)))
      const cleanup = await runCleanup(env, limit)
      return json({ success: true, ...cleanup })
    }

    if (request.method === 'POST') {
      return uploadImage(request, env)
    }

    return json({ success: false, message: 'Not Found' }, 404)
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    await runCleanup(env, 200)
  },
} satisfies ExportedHandler<Env>
