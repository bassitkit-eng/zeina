export type UploadedImageMeta = {
  imageUrl: string
  storagePath: string
}

type WorkerUploadResponse = {
  success?: boolean
  imageUrl?: string
  storagePath?: string
  message?: string
}

const WORKER_UPLOAD_URL = 'https://zeina-api.zeinaevents-eg.workers.dev'
const WORKER_DELETE_URL = `${WORKER_UPLOAD_URL}/delete`

export async function uploadProductImage(params: {
  file: File
  userId: string
  productId: string
}): Promise<UploadedImageMeta> {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('userId', params.userId)
  formData.append('productId', params.productId)

  const response = await fetch(WORKER_UPLOAD_URL, {
    method: 'POST',
    body: formData,
  })

  let data: WorkerUploadResponse = {}
  try {
    data = (await response.json()) as WorkerUploadResponse
  } catch {
    // Keep generic message if Worker did not return JSON.
  }

  if (!response.ok || !data.success || !data.imageUrl || !data.storagePath) {
    throw new Error(data.message || 'فشل رفع الصورة إلى خدمة التخزين.')
  }

  return {
    imageUrl: data.imageUrl,
    storagePath: data.storagePath,
  }
}

export function buildProductImagesPayload(productId: string, images: UploadedImageMeta[]) {
  return images.map((image, index) => ({
    product_id: productId,
    image_url: image.imageUrl,
    storage_path: image.storagePath,
    sort_order: index,
    is_primary: index === 0,
  }))
}

type WorkerDeleteResponse = {
  success?: boolean
  message?: string
}

export async function deleteProductImageByStoragePath(storagePath: string): Promise<boolean> {
  const nextPath = (storagePath || '').trim()
  if (!nextPath) return true

  const response = await fetch(WORKER_DELETE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storagePath: nextPath }),
  })

  let data: WorkerDeleteResponse = {}
  try {
    data = (await response.json()) as WorkerDeleteResponse
  } catch {
    // ignore non-json responses
  }

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'تعذر حذف الصورة من التخزين الآن.')
  }

  return true
}
