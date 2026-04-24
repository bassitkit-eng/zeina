import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseAdminClient } from '@/lib/supabase/server'

type UserStorageSnapshot = {
  userId: string
  vendorIds: string[]
  productIds: string[]
  storagePaths: string[]
}

function getAuthToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') || ''
  if (!auth.toLowerCase().startsWith('bearer ')) return null
  return auth.slice(7).trim() || null
}

async function getAuthedUserId(token: string): Promise<string | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) throw new Error('Missing Supabase public env vars on server.')

  const authClient = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })

  const { data, error } = await authClient.auth.getUser()
  if (error || !data.user?.id) return null
  return data.user.id
}

async function collectSnapshot(admin: ReturnType<typeof createSupabaseAdminClient>, userId: string): Promise<UserStorageSnapshot> {
  const { data: vendors } = await admin.from('vendor_profiles').select('id').eq('user_id', userId)
  const vendorIds = (vendors || []).map((v) => String(v.id))

  let productIds: string[] = []
  let productCoverPaths: string[] = []

  if (vendorIds.length > 0) {
    const { data: products } = await admin.from('products').select('id,cover_storage_path').in('vendor_id', vendorIds)
    productIds = (products || []).map((p) => String(p.id))
    productCoverPaths = (products || []).map((p) => (p.cover_storage_path ? String(p.cover_storage_path) : '')).filter(Boolean)
  }

  let productImagePaths: string[] = []
  if (productIds.length > 0) {
    const { data: productImages } = await admin.from('product_images').select('storage_path').in('product_id', productIds)
    productImagePaths = (productImages || []).map((p) => (p.storage_path ? String(p.storage_path) : '')).filter(Boolean)
  }

  const storagePaths = Array.from(new Set([...productCoverPaths, ...productImagePaths]))

  return { userId, vendorIds, productIds, storagePaths }
}

async function triggerCleanupAndVerifyR2(storagePaths: string[]) {
  const workerBase = (process.env.CLOUDFLARE_WORKER_BASE_URL || 'https://zeina-api.zeinaevents-eg.workers.dev').replace(/\/$/, '')
  const cleanupSecret = (process.env.CLOUDFLARE_CLEANUP_SECRET || process.env.CLEANUP_SECRET || '').trim()

  let cleanupTriggered = false
  let cleanupResponse: unknown = null
  let cleanupError = ''

  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (cleanupSecret) headers['x-cleanup-secret'] = cleanupSecret
    const response = await fetch(`${workerBase}/cleanup`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ limit: 500 }),
    })
    cleanupTriggered = response.ok
    cleanupResponse = await response.json().catch(() => null)
    if (!response.ok) cleanupError = `Cleanup failed with status ${response.status}`
  } catch (error) {
    cleanupError = error instanceof Error ? error.message : 'Cleanup request failed'
  }

  const checks = await Promise.all(
    storagePaths.slice(0, 30).map(async (path) => {
      const url = `${workerBase}/objects/${encodeURIComponent(path)}`
      try {
        const response = await fetch(url, { method: 'GET' })
        return { storagePath: path, deleted: response.status === 404, status: response.status }
      } catch {
        return { storagePath: path, deleted: false, status: 0 }
      }
    })
  )

  const remaining = checks.filter((c) => !c.deleted).map((c) => c.storagePath)

  return {
    cleanupTriggered,
    cleanupResponse,
    cleanupError,
    checkedCount: checks.length,
    deletedCount: checks.length - remaining.length,
    remainingPathsSample: remaining.slice(0, 10),
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getAuthToken(req)
    if (!token) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const userId = await getAuthedUserId(token)
    if (!userId) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })

    const admin = createSupabaseAdminClient()
    const snapshot = await collectSnapshot(admin, userId)

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      return NextResponse.json(
        { success: false, message: `Failed to delete user: ${deleteError.message}` },
        { status: 500 }
      )
    }

    const [{ data: profileRow }, { count: vendorCount }, { count: productCount }, { count: imageCount }] = await Promise.all([
      admin.from('profiles').select('id').eq('id', userId).maybeSingle(),
      admin.from('vendor_profiles').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      snapshot.vendorIds.length > 0
        ? admin.from('products').select('*', { count: 'exact', head: true }).in('vendor_id', snapshot.vendorIds)
        : Promise.resolve({ count: 0, error: null } as { count: number; error: null }),
      snapshot.productIds.length > 0
        ? admin.from('product_images').select('*', { count: 'exact', head: true }).in('product_id', snapshot.productIds)
        : Promise.resolve({ count: 0, error: null } as { count: number; error: null }),
    ])

    const r2Report = await triggerCleanupAndVerifyR2(snapshot.storagePaths)

    return NextResponse.json({
      success: true,
      report: {
        deletedUserId: userId,
        beforeDelete: {
          vendorProfiles: snapshot.vendorIds.length,
          products: snapshot.productIds.length,
          storagePaths: snapshot.storagePaths.length,
        },
        supabaseAfterDelete: {
          profileExists: Boolean(profileRow?.id),
          vendorProfilesRemaining: vendorCount || 0,
          productsRemaining: productCount || 0,
          productImagesRemaining: imageCount || 0,
        },
        r2: r2Report,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error'
    return NextResponse.json({ success: false, message }, { status: 500 })
  }
}

