'use client'

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { ALL_PRODUCTS, type CategoryId, type Product, type ProductContactInfo, type ProductId, type ProductStatus } from '@/lib/catalog'
import { supabaseClient } from '@/lib/supabase/client'
import { deleteProductImageByStoragePath } from '@/lib/services/productImageUpload'

type ProductFormInput = {
  name: string
  price: number
  location: string
  city: string
  category: CategoryId
  productType: string
  imagePaths: string[]
  imageStoragePaths?: string[]
  status: ProductStatus
  description?: string
  contactInfo?: ProductContactInfo
}

type CategoryRow = { id: string; name: string | null; slug: string | null }
type SubcategoryRow = { id: string; category_id: string | null; name: string | null }
type GovernorateRow = { id: string; name_ar: string | null; name_en: string | null }
type CityRow = { id: string; governorate_id: string | null; name_ar: string | null; name_en: string | null }
type VendorContactRow = {
  id: string
  phone: string | null
  whatsapp: string | null
  instagram: string | null
  facebook: string | null
  tiktok: string | null
}
type ProductRow = {
  id: string
  vendor_id: string
  category_id: string | null
  subcategory_id: string | null
  title: string | null
  description: string | null
  price: number | null
  cover_image_url: string | null
  cover_storage_path: string | null
  governorate_id: string | null
  city_id: string | null
  address_text: string | null
  status: ProductStatus | null
}
type ProductImageRow = {
  product_id: string
  image_url: string | null
  storage_path: string | null
  sort_order: number | null
  is_primary: boolean | null
}

type LookupMaps = {
  dbCategoryByApp: Partial<Record<CategoryId, string>>
  appCategoryByDb: Map<string, CategoryId>
  subcategoryByCategoryAndName: Map<string, string>
  subcategoryNameById: Map<string, string>
  governorateByName: Map<string, string>
  governorateNameById: Map<string, string>
  cityByGovernorateAndName: Map<string, string>
  cityNameById: Map<string, string>
}

interface ProductsContextType {
  isLoading: boolean
  allProducts: Product[]
  productsByCategory: Record<CategoryId, Product[]>
  customProducts: Product[]
  addProduct: (input: ProductFormInput) => Promise<ProductId>
  updateProduct: (id: ProductId, input: ProductFormInput) => Promise<void>
  updateProductStatus: (id: ProductId, status: ProductStatus) => Promise<void>
  deleteProduct: (id: ProductId) => Promise<void>
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

const baseProductsByCategory: Record<CategoryId, Product[]> = {
  kosha: ALL_PRODUCTS.filter((p) => p.category === 'kosha'),
  mirrors: ALL_PRODUCTS.filter((p) => p.category === 'mirrors'),
  cakes: ALL_PRODUCTS.filter((p) => p.category === 'cakes'),
}

const DB_TIMEOUT_MS = 20000
const DB_RETRY_DELAY_MS = 1000

function normalizeText(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

function asError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof Error) return error
  if (error && typeof error === 'object' && 'message' in error) {
    return new Error(String((error as { message?: string }).message || fallbackMessage))
  }
  return new Error(fallbackMessage)
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

function isRetryableError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error || '').toLowerCase()
  return (
    message.includes('timeout') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('upstream connect error') ||
    message.includes('connection')
  )
}

async function runDbCall<T>(operation: () => Promise<T>, fallbackMessage: string): Promise<T> {
  const run = () => withTimeout(operation(), DB_TIMEOUT_MS, fallbackMessage)

  try {
    return await run()
  } catch (error) {
    if (!isRetryableError(error)) throw asError(error, fallbackMessage)
    await delay(DB_RETRY_DELAY_MS)
    return await run().catch(async (retryError) => {
      if (!isRetryableError(retryError)) throw asError(retryError, fallbackMessage)
      await delay(DB_RETRY_DELAY_MS)
      return await run().catch((finalError) => {
        throw asError(finalError, fallbackMessage)
      })
    })
  }
}

function cityKey(governorateId: string, cityName: string) {
  return `${governorateId}::${normalizeText(cityName)}`
}

function subcategoryKey(categoryId: string, subcategoryName: string) {
  return `${categoryId}::${normalizeText(subcategoryName)}`
}

function uniqueStoragePaths(paths: Array<string | null | undefined>) {
  return Array.from(new Set(paths.map((item) => (item || '').trim()).filter(Boolean)))
}

function matchAppCategory(category: CategoryRow): CategoryId | null {
  const slug = normalizeText(category.slug)
  const name = normalizeText(category.name)

  if (slug === 'kosha' || slug.includes('kosh') || slug.includes('kocha') || name.includes('kosh') || name.includes('kocha')) return 'kosha'
  if (slug === 'mirrors' || slug === 'mirror' || slug.includes('mirror') || name.includes('mirror')) return 'mirrors'
  if (
    slug === 'cakes' ||
    slug === 'cake' ||
    slug === 'tortat' ||
    slug.includes('cake') ||
    slug.includes('tort') ||
    name.includes('cake') ||
    name.includes('tort')
  ) {
    return 'cakes'
  }

  return null
}

async function fetchLookupMaps(): Promise<LookupMaps> {
  const categoriesResult = await runDbCall(
    () => supabaseClient.from('categories').select('id,name,slug').eq('is_active', true),
    'تعذر تحميل التصنيفات والمواقع. تحقق من الاتصال.'
  )
  const subcategoriesResult = await runDbCall(
    () => supabaseClient.from('subcategories').select('id,category_id,name').eq('is_active', true),
    'تعذر تحميل التصنيفات والمواقع. تحقق من الاتصال.'
  )
  const governoratesResult = await runDbCall(
    () => supabaseClient.from('governorates').select('id,name_ar,name_en'),
    'تعذر تحميل التصنيفات والمواقع. تحقق من الاتصال.'
  )
  const citiesResult = await runDbCall(
    () => supabaseClient.from('cities').select('id,governorate_id,name_ar,name_en'),
    'تعذر تحميل التصنيفات والمواقع. تحقق من الاتصال.'
  )

  if (categoriesResult.error) throw asError(categoriesResult.error, 'تعذر قراءة التصنيفات.')
  if (subcategoriesResult.error) throw asError(subcategoriesResult.error, 'تعذر قراءة التصنيفات الفرعية.')
  if (governoratesResult.error) throw asError(governoratesResult.error, 'تعذر قراءة المحافظات.')
  if (citiesResult.error) throw asError(citiesResult.error, 'تعذر قراءة المدن.')

  const categories = categoriesResult.data || []
  const subcategories = subcategoriesResult.data || []
  const governorates = governoratesResult.data || []
  const cities = citiesResult.data || []

  const dbCategoryByApp: Partial<Record<CategoryId, string>> = {}
  const appCategoryByDb = new Map<string, CategoryId>()

  ;(categories || []).forEach((category) => {
    const appCategory = matchAppCategory(category as CategoryRow)
    if (!appCategory) return
    dbCategoryByApp[appCategory] = (category as CategoryRow).id
    appCategoryByDb.set((category as CategoryRow).id, appCategory)
  })

  const subcategoryByCategoryAndName = new Map<string, string>()
  const subcategoryNameById = new Map<string, string>()

  ;(subcategories || []).forEach((row) => {
    const item = row as SubcategoryRow
    if (!item.id || !item.category_id || !item.name) return
    subcategoryByCategoryAndName.set(subcategoryKey(item.category_id, item.name), item.id)
    subcategoryNameById.set(item.id, item.name)
  })

  const governorateByName = new Map<string, string>()
  const governorateNameById = new Map<string, string>()

  ;(governorates || []).forEach((row) => {
    const item = row as GovernorateRow
    if (item.name_ar) governorateByName.set(normalizeText(item.name_ar), item.id)
    if (item.name_en) governorateByName.set(normalizeText(item.name_en), item.id)
    governorateNameById.set(item.id, item.name_ar || item.name_en || '')
  })

  const cityByGovernorateAndName = new Map<string, string>()
  const cityNameById = new Map<string, string>()

  ;(cities || []).forEach((row) => {
    const item = row as CityRow
    if (!item.governorate_id) return
    if (item.name_ar) cityByGovernorateAndName.set(cityKey(item.governorate_id, item.name_ar), item.id)
    if (item.name_en) cityByGovernorateAndName.set(cityKey(item.governorate_id, item.name_en), item.id)
    cityNameById.set(item.id, item.name_ar || item.name_en || '')
  })

  return {
    dbCategoryByApp,
    appCategoryByDb,
    subcategoryByCategoryAndName,
    subcategoryNameById,
    governorateByName,
    governorateNameById,
    cityByGovernorateAndName,
    cityNameById,
  }
}

function mapRowsToProducts(
  rows: ProductRow[],
  images: ProductImageRow[],
  vendorContacts: Map<string, ProductContactInfo>,
  lookup: LookupMaps
): Product[] {
  const groupedImages = new Map<string, ProductImageRow[]>()

  images.forEach((img) => {
    const current = groupedImages.get(img.product_id) || []
    current.push(img)
    groupedImages.set(img.product_id, current)
  })

  groupedImages.forEach((list) => {
    list.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
  })

  return rows.map((row) => {
    const appCategory = (row.category_id && lookup.appCategoryByDb.get(row.category_id)) || 'kosha'
    const productImages = (groupedImages.get(row.id) || []).map((item) => item.image_url).filter((url): url is string => Boolean(url))
    const storagePaths = (groupedImages.get(row.id) || []).map((item) => item.storage_path).filter((path): path is string => Boolean(path))

    const imagePath = productImages[0] || row.cover_image_url || '/placeholder.svg'

    const governorateName = row.governorate_id ? lookup.governorateNameById.get(row.governorate_id) || '' : ''
    const cityName = row.city_id ? lookup.cityNameById.get(row.city_id) || '' : ''
    const subcategoryName = row.subcategory_id ? lookup.subcategoryNameById.get(row.subcategory_id) || '' : ''
    const contactInfo = vendorContacts.get(row.vendor_id) || {}

    return {
      id: row.id,
      name: row.title || 'Untitled Product',
      price: Number(row.price || 0),
      city: governorateName || 'Unknown',
      location: cityName || row.address_text || 'Unknown',
      category: appCategory,
      productType: subcategoryName || 'عام',
      imagePath,
      imagePaths: productImages.length > 0 ? productImages : [imagePath],
      imageStoragePaths: storagePaths.length > 0 ? storagePaths : row.cover_storage_path ? [row.cover_storage_path] : [],
      status: row.status || 'draft',
      description: row.description || '',
      contactInfo,
    }
  })
}

async function fetchProductImages(productIds: string[]) {
  if (productIds.length === 0) return [] as ProductImageRow[]

  const { data, error } = await runDbCall(
    () =>
      supabaseClient
        .from('product_images')
        .select('product_id,image_url,storage_path,sort_order,is_primary')
        .in('product_id', productIds),
    'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
  )

  if (error) throw asError(error, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
  return (data || []) as ProductImageRow[]
}

async function fetchVendorContacts(vendorIds: string[]) {
  if (vendorIds.length === 0) return new Map<string, ProductContactInfo>()

  const { data, error } = await runDbCall(
    () =>
      supabaseClient
        .from('vendor_profiles')
        .select('id,phone,whatsapp,instagram,facebook,tiktok')
        .in('id', Array.from(new Set(vendorIds))),
    'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
  )

  if (error) throw asError(error, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

  const output = new Map<string, ProductContactInfo>()
  ;((data || []) as VendorContactRow[]).forEach((row) => {
    output.set(row.id, {
      phone: row.phone || undefined,
      whatsapp: row.whatsapp || undefined,
      instagram: row.instagram || undefined,
      facebook: row.facebook || undefined,
      tiktok: row.tiktok || undefined,
    })
  })

  return output
}

async function syncVendorContact(
  vendorProfileId: string,
  input: ProductFormInput,
  governorateId: string | null,
  cityId: string | null
) {
  const { error } = await runDbCall(
    () =>
      supabaseClient
        .from('vendor_profiles')
        .update({
          phone: input.contactInfo?.phone || null,
          whatsapp: input.contactInfo?.whatsapp || null,
          instagram: input.contactInfo?.instagram || null,
          facebook: input.contactInfo?.facebook || null,
          tiktok: input.contactInfo?.tiktok || null,
          governorate_id: governorateId,
          city_id: cityId,
          address_text: input.location || null,
        })
        .eq('id', vendorProfileId),
    'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
  )

  if (error) throw asError(error, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
}

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [customProducts, setCustomProducts] = useState<Product[]>([])
  const [publishedProducts, setPublishedProducts] = useState<Product[]>([])
  const [lookupMaps, setLookupMaps] = useState<LookupMaps | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const lookupMapsPromiseRef = useRef<Promise<LookupMaps> | null>(null)
  const refreshInFlightRef = useRef<Promise<void> | null>(null)

  const getLookupMaps = async () => {
    if (lookupMaps) return lookupMaps
    if (lookupMapsPromiseRef.current) return lookupMapsPromiseRef.current

    const pendingLookup = fetchLookupMaps()
      .then((result) => {
        setLookupMaps(result)
        return result
      })
      .finally(() => {
        lookupMapsPromiseRef.current = null
      })

    lookupMapsPromiseRef.current = pendingLookup
    return pendingLookup
  }

  const resolveCurrentUserId = async () => {
    if (userId) return userId
    const { data, error } = await runDbCall(() => supabaseClient.auth.getUser(), 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
    if (error) throw asError(error, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
    return data.user?.id || null
  }

  const getOrCreateVendorProfileId = async (currentUserId: string) => {
    let existingError: unknown = null

    try {
      const { data: existing, error } = await runDbCall(
        () =>
          supabaseClient
            .from('vendor_profiles')
            .select('id')
            .eq('user_id', currentUserId)
            .maybeSingle(),
        'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
      )

      if (error) {
        existingError = error
      } else if (existing?.id) {
        return existing.id as string
      }
    } catch (error) {
      existingError = error
    }

    // If read fails or row does not exist, try creating directly.
    const { data: created, error: createError } = await runDbCall(
      () =>
        supabaseClient
          .from('vendor_profiles')
          .insert({ user_id: currentUserId, business_name: 'Zeina Vendor' })
          .select('id')
          .single(),
      'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
    )

    if (!createError && created?.id) {
      return created.id as string
    }

    // Handles race-condition: another request created the row first.
    if (createError && (createError.code === '23505' || createError.status === 409)) {
      const { data: afterConflict, error: afterConflictError } = await runDbCall(
        () =>
          supabaseClient
            .from('vendor_profiles')
            .select('id')
            .eq('user_id', currentUserId)
            .single(),
        'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
      )

      if (afterConflictError) throw asError(afterConflictError, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
      if (afterConflict?.id) return afterConflict.id as string
    }

    if (createError) throw asError(createError, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
    if (existingError) throw asError(existingError, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
    throw new Error('تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
  }

  const loadProductStoragePaths = async (productId: string) => {
    const [{ data: productRow }, { data: imageRows }] = await Promise.all([
      runDbCall(
        () => supabaseClient.from('products').select('cover_storage_path').eq('id', productId).maybeSingle(),
        'Unable to read product cover path.'
      ),
      runDbCall(
        () => supabaseClient.from('product_images').select('storage_path').eq('product_id', productId),
        'Unable to read product image paths.'
      ),
    ])

    const coverPath = productRow?.cover_storage_path ? String(productRow.cover_storage_path) : ''
    const imagePaths = (imageRows || []).map((row) => (row.storage_path ? String(row.storage_path) : ''))
    return uniqueStoragePaths([coverPath, ...imagePaths])
  }

  const deleteR2PathsBestEffort = async (paths: string[]) => {
    const uniquePaths = uniqueStoragePaths(paths)
    if (uniquePaths.length === 0) return

    const results = await Promise.allSettled(uniquePaths.map((path) => deleteProductImageByStoragePath(path)))
    const failedCount = results.filter((item) => item.status === 'rejected').length
    if (failedCount > 0) {
      console.warn(`R2 direct delete failed for ${failedCount}/${uniquePaths.length} paths.`)
    }
  }

  const fetchPublished = async (lookup: LookupMaps) => {
    const { data, error } = await runDbCall(
      () =>
        supabaseClient
          .from('products')
          .select('id,vendor_id,category_id,subcategory_id,title,description,price,cover_image_url,cover_storage_path,governorate_id,city_id,address_text,status')
          .eq('status', 'published')
          .order('created_at', { ascending: false }),
      'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
    )

    if (error) throw asError(error, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    const productRows = (data || []) as ProductRow[]
    const images = await fetchProductImages(productRows.map((row) => row.id))
    const contacts = await fetchVendorContacts(productRows.map((row) => row.vendor_id))
    setPublishedProducts(mapRowsToProducts(productRows, images, contacts, lookup))
  }

  const fetchVendorProducts = async (lookup: LookupMaps, currentUserId: string | null) => {
    if (!currentUserId) {
      setCustomProducts([])
      return
    }

    const vendorProfileId = await getOrCreateVendorProfileId(currentUserId)

    const { data, error } = await runDbCall(
      () =>
        supabaseClient
          .from('products')
          .select('id,vendor_id,category_id,subcategory_id,title,description,price,cover_image_url,cover_storage_path,governorate_id,city_id,address_text,status')
          .eq('vendor_id', vendorProfileId)
          .order('created_at', { ascending: false }),
      'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
    )

    if (error) throw asError(error, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    const productRows = (data || []) as ProductRow[]
    const images = await fetchProductImages(productRows.map((row) => row.id))
    const contacts = await fetchVendorContacts(productRows.map((row) => row.vendor_id))
    setCustomProducts(mapRowsToProducts(productRows, images, contacts, lookup))
  }

  const refreshProducts = async (currentUserId: string | null) => {
    if (refreshInFlightRef.current) return refreshInFlightRef.current

    setIsLoading(true)
    const task = (async () => {
      try {
        const lookup = await getLookupMaps()
        await Promise.all([fetchPublished(lookup), fetchVendorProducts(lookup, currentUserId)])
      } catch (error) {
        console.error('Failed to refresh products', error)
      } finally {
        setIsLoading(false)
      }
    })()

    refreshInFlightRef.current = task
    await task.finally(() => {
      refreshInFlightRef.current = null
    })
  }

  useEffect(() => {
    let isMounted = true

    supabaseClient.auth.getUser().then(({ data }) => {
      if (!isMounted) return
      const currentUserId = data.user?.id || null
      setUserId(currentUserId)
      void refreshProducts(currentUserId)
    })

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return
      const currentUserId = session?.user?.id || null
      setUserId(currentUserId)
      if (event === 'TOKEN_REFRESHED') return
      await refreshProducts(currentUserId)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addProduct = async (input: ProductFormInput) => {
    const currentUserId = await resolveCurrentUserId()
    if (!currentUserId) throw new Error('تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    const lookup = await getLookupMaps()

    const categoryDbId = lookup.dbCategoryByApp[input.category]
    if (!categoryDbId) {
      throw new Error('Category mapping was not found in database. Check categories table.')
    }
    const subcategoryDbId =
      input.productType && input.productType !== 'عام'
        ? lookup.subcategoryByCategoryAndName.get(subcategoryKey(categoryDbId, input.productType)) || null
        : null

    const governorateId = lookup.governorateByName.get(normalizeText(input.city)) || null
    const cityId = governorateId ? lookup.cityByGovernorateAndName.get(cityKey(governorateId, input.location)) || null : null
    const vendorProfileId = await getOrCreateVendorProfileId(currentUserId)

    const coverImageUrl = input.imagePaths[0] || null
    const coverStoragePath = input.imageStoragePaths?.[0] || null

    const { data: insertedProduct, error: insertError } = await runDbCall(
      () =>
        supabaseClient
          .from('products')
          .insert({
            vendor_id: vendorProfileId,
            category_id: categoryDbId,
            subcategory_id: subcategoryDbId,
            title: input.name,
            description: input.description || null,
            price: input.price,
            cover_image_url: coverImageUrl,
            cover_storage_path: coverStoragePath,
            governorate_id: governorateId,
            city_id: cityId,
            address_text: input.location || null,
            status: input.status,
          })
          .select('id')
          .single(),
      'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
    )

    if (insertError) throw asError(insertError, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    const productId = insertedProduct.id as string

    // Keep publish fast; contact sync runs in background and won't block publish.
    void syncVendorContact(vendorProfileId, input, governorateId, cityId).catch((error) => {
      console.warn('Vendor contact sync failed:', error)
    })

    const imagesPayload = input.imagePaths.map((imageUrl, index) => ({
      product_id: productId,
      image_url: imageUrl,
      storage_path: input.imageStoragePaths?.[index] || null,
      sort_order: index,
      is_primary: index === 0,
    }))

    if (imagesPayload.length > 0) {
      const { error: imagesError } = await runDbCall(
        () => supabaseClient.from('product_images').insert(imagesPayload),
        'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.'
      )
      if (imagesError) throw asError(imagesError, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
    }

    void refreshProducts(currentUserId)
    return productId
  }

  const updateProduct = async (id: ProductId, input: ProductFormInput) => {
    const currentUserId = await resolveCurrentUserId()
    if (!currentUserId) throw new Error('تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    const lookup = await getLookupMaps()

    const categoryDbId = lookup.dbCategoryByApp[input.category]
    if (!categoryDbId) {
      throw new Error('Category mapping was not found in database. Check categories table.')
    }
    const subcategoryDbId =
      input.productType && input.productType !== 'عام'
        ? lookup.subcategoryByCategoryAndName.get(subcategoryKey(categoryDbId, input.productType)) || null
        : null

    const governorateId = lookup.governorateByName.get(normalizeText(input.city)) || null
    const cityId = governorateId ? lookup.cityByGovernorateAndName.get(cityKey(governorateId, input.location)) || null : null
    const vendorProfileId = await getOrCreateVendorProfileId(currentUserId)
    await syncVendorContact(vendorProfileId, input, governorateId, cityId)
    const productId = String(id)

    let oldStoragePaths: string[] = []
    try {
      oldStoragePaths = await loadProductStoragePaths(productId)
    } catch (error) {
      console.warn('Failed to load old storage paths before update:', error)
    }

    const { error: updateError } = await supabaseClient
      .from('products')
      .update({
        category_id: categoryDbId,
        subcategory_id: subcategoryDbId,
        title: input.name,
        description: input.description || null,
        price: input.price,
        cover_image_url: input.imagePaths[0] || null,
        cover_storage_path: input.imageStoragePaths?.[0] || null,
        governorate_id: governorateId,
        city_id: cityId,
        address_text: input.location || null,
        status: input.status,
      })
      .eq('id', String(id))

    if (updateError) throw asError(updateError, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    const { error: deleteImagesError } = await supabaseClient.from('product_images').delete().eq('product_id', productId)
    if (deleteImagesError) throw asError(deleteImagesError, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    const imagesPayload = input.imagePaths.map((imageUrl, index) => ({
      product_id: productId,
      image_url: imageUrl,
      storage_path: input.imageStoragePaths?.[index] || null,
      sort_order: index,
      is_primary: index === 0,
    }))

    if (imagesPayload.length > 0) {
      const { error: imagesError } = await supabaseClient.from('product_images').insert(imagesPayload)
      if (imagesError) throw asError(imagesError, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')
    }

    const nextStoragePaths = uniqueStoragePaths(input.imageStoragePaths || [])
    const pathsToDelete = oldStoragePaths.filter((path) => !nextStoragePaths.includes(path))
    void deleteR2PathsBestEffort(pathsToDelete)

    void refreshProducts(currentUserId)
  }

  const updateProductStatus = async (id: ProductId, status: ProductStatus) => {
    const currentUserId = await resolveCurrentUserId()
    if (!currentUserId) throw new Error('تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    const { error } = await supabaseClient.from('products').update({ status }).eq('id', String(id))
    if (error) throw asError(error, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    void refreshProducts(currentUserId)
  }

  const deleteProduct = async (id: ProductId) => {
    const currentUserId = await resolveCurrentUserId()
    if (!currentUserId) throw new Error('تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    const productId = String(id)
    let storagePaths: string[] = []

    try {
      storagePaths = await loadProductStoragePaths(productId)
    } catch (error) {
      console.warn('Failed to load product storage paths before delete:', error)
    }

    const { error: deleteImagesError } = await supabaseClient.from('product_images').delete().eq('product_id', productId)
    if (deleteImagesError) {
      // Do not block product deletion if explicit image-delete is denied by RLS;
      // FK cascade can still remove related rows when deleting the product.
      console.warn('Delete product_images warning:', deleteImagesError)
    }

    const { error: deleteProductError } = await supabaseClient.from('products').delete().eq('id', productId)
    if (deleteProductError) throw asError(deleteProductError, 'تعذر الاتصال بقاعدة البيانات. حاول مرة أخرى.')

    void deleteR2PathsBestEffort(storagePaths)
    void refreshProducts(currentUserId)
  }

  const allProducts = useMemo(() => [...ALL_PRODUCTS, ...publishedProducts], [publishedProducts])

  const productsByCategory = useMemo<Record<CategoryId, Product[]>>(
    () => ({
      kosha: [...baseProductsByCategory.kosha, ...publishedProducts.filter((p) => p.category === 'kosha')],
      mirrors: [...baseProductsByCategory.mirrors, ...publishedProducts.filter((p) => p.category === 'mirrors')],
      cakes: [...baseProductsByCategory.cakes, ...publishedProducts.filter((p) => p.category === 'cakes')],
    }),
    [publishedProducts]
  )

  return (
    <ProductsContext.Provider
      value={{
        isLoading,
        allProducts,
        productsByCategory,
        customProducts,
        addProduct,
        updateProduct,
        updateProductStatus,
        deleteProduct,
      }}
    >
      {children}
    </ProductsContext.Provider>
  )
}

export function useProducts() {
  const context = useContext(ProductsContext)
  if (!context) {
    throw new Error('useProducts must be used within ProductsProvider')
  }
  return context
}


