'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ALL_PRODUCTS, type CategoryId, type Product, type ProductContactInfo, type ProductId, type ProductStatus } from '@/lib/catalog'
import { supabaseClient } from '@/lib/supabase/client'

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
type GovernorateRow = { id: string; name_ar: string | null; name_en: string | null }
type CityRow = { id: string; governorate_id: string | null; name_ar: string | null; name_en: string | null }
type ProductRow = {
  id: string
  vendor_id: string
  category_id: string | null
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

function normalizeText(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

function cityKey(governorateId: string, cityName: string) {
  return `${governorateId}::${normalizeText(cityName)}`
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
  const [{ data: categories }, { data: governorates }, { data: cities }] = await Promise.all([
    supabaseClient.from('categories').select('id,name,slug').eq('is_active', true),
    supabaseClient.from('governorates').select('id,name_ar,name_en'),
    supabaseClient.from('cities').select('id,governorate_id,name_ar,name_en'),
  ])

  const dbCategoryByApp: Partial<Record<CategoryId, string>> = {}
  const appCategoryByDb = new Map<string, CategoryId>()

  ;(categories || []).forEach((category) => {
    const appCategory = matchAppCategory(category as CategoryRow)
    if (!appCategory) return
    dbCategoryByApp[appCategory] = (category as CategoryRow).id
    appCategoryByDb.set((category as CategoryRow).id, appCategory)
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
    governorateByName,
    governorateNameById,
    cityByGovernorateAndName,
    cityNameById,
  }
}

function mapRowsToProducts(rows: ProductRow[], images: ProductImageRow[], lookup: LookupMaps): Product[] {
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

    return {
      id: row.id,
      name: row.title || 'Untitled Product',
      price: Number(row.price || 0),
      city: governorateName || 'Unknown',
      location: cityName || row.address_text || 'Unknown',
      category: appCategory,
      productType: 'General',
      imagePath,
      imagePaths: productImages.length > 0 ? productImages : [imagePath],
      imageStoragePaths: storagePaths.length > 0 ? storagePaths : row.cover_storage_path ? [row.cover_storage_path] : [],
      status: row.status || 'draft',
      description: row.description || '',
      contactInfo: {},
    }
  })
}

async function fetchProductImages(productIds: string[]) {
  if (productIds.length === 0) return [] as ProductImageRow[]

  const { data, error } = await supabaseClient
    .from('product_images')
    .select('product_id,image_url,storage_path,sort_order,is_primary')
    .in('product_id', productIds)

  if (error) throw error
  return (data || []) as ProductImageRow[]
}

async function syncVendorContact(
  vendorProfileId: string,
  input: ProductFormInput,
  governorateId: string | null,
  cityId: string | null
) {
  const { error } = await supabaseClient
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
    .eq('id', vendorProfileId)

  if (error) throw error
}

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [customProducts, setCustomProducts] = useState<Product[]>([])
  const [publishedProducts, setPublishedProducts] = useState<Product[]>([])
  const [lookupMaps, setLookupMaps] = useState<LookupMaps | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  const getOrCreateVendorProfileId = async (currentUserId: string) => {
    const { data: existing, error: existingError } = await supabaseClient
      .from('vendor_profiles')
      .select('id')
      .eq('user_id', currentUserId)
      .maybeSingle()

    if (existingError) throw existingError
    if (existing?.id) return existing.id as string

    const { data: created, error: createError } = await supabaseClient
      .from('vendor_profiles')
      .insert({ user_id: currentUserId, business_name: 'Zeina Vendor' })
      .select('id')
      .single()

    if (createError) {
      // Handles race-condition: another request created the row first.
      if (createError.code === '23505') {
        const { data: afterConflict, error: afterConflictError } = await supabaseClient
          .from('vendor_profiles')
          .select('id')
          .eq('user_id', currentUserId)
          .single()

        if (afterConflictError) throw afterConflictError
        return afterConflict.id as string
      }
      throw createError
    }
    return created.id as string
  }

  const fetchPublished = async (lookup: LookupMaps) => {
    const { data, error } = await supabaseClient
      .from('products')
      .select('id,vendor_id,category_id,title,description,price,cover_image_url,cover_storage_path,governorate_id,city_id,address_text,status')
      .eq('status', 'published')
      .order('created_at', { ascending: false })

    if (error) throw error

    const productRows = (data || []) as ProductRow[]
    const images = await fetchProductImages(productRows.map((row) => row.id))
    setPublishedProducts(mapRowsToProducts(productRows, images, lookup))
  }

  const fetchVendorProducts = async (lookup: LookupMaps, currentUserId: string | null) => {
    if (!currentUserId) {
      setCustomProducts([])
      return
    }

    const vendorProfileId = await getOrCreateVendorProfileId(currentUserId)

    const { data, error } = await supabaseClient
      .from('products')
      .select('id,vendor_id,category_id,title,description,price,cover_image_url,cover_storage_path,governorate_id,city_id,address_text,status')
      .eq('vendor_id', vendorProfileId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const productRows = (data || []) as ProductRow[]
    const images = await fetchProductImages(productRows.map((row) => row.id))
    setCustomProducts(mapRowsToProducts(productRows, images, lookup))
  }

  const refreshProducts = async (currentUserId: string | null) => {
    setIsLoading(true)
    try {
      const lookup = lookupMaps || (await fetchLookupMaps())
      if (!lookupMaps) setLookupMaps(lookup)

      await Promise.all([fetchPublished(lookup), fetchVendorProducts(lookup, currentUserId)])
    } catch (error) {
      console.error('Failed to refresh products', error)
    } finally {
      setIsLoading(false)
    }
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
    } = supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      const currentUserId = session?.user?.id || null
      setUserId(currentUserId)
      await refreshProducts(currentUserId)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addProduct = async (input: ProductFormInput) => {
    if (!userId) throw new Error('You must be logged in to add products.')

    const lookup = lookupMaps || (await fetchLookupMaps())
    if (!lookupMaps) setLookupMaps(lookup)

    const categoryDbId = lookup.dbCategoryByApp[input.category]
    if (!categoryDbId) {
      throw new Error('Category mapping was not found in database. Check categories table.')
    }

    const governorateId = lookup.governorateByName.get(normalizeText(input.city)) || null
    const cityId = governorateId ? lookup.cityByGovernorateAndName.get(cityKey(governorateId, input.location)) || null : null
    const vendorProfileId = await getOrCreateVendorProfileId(userId)
    await syncVendorContact(vendorProfileId, input, governorateId, cityId)

    const coverImageUrl = input.imagePaths[0] || null
    const coverStoragePath = input.imageStoragePaths?.[0] || null

    const { data: insertedProduct, error: insertError } = await supabaseClient
      .from('products')
      .insert({
        vendor_id: vendorProfileId,
        category_id: categoryDbId,
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
      .single()

    if (insertError) throw insertError

    const productId = insertedProduct.id as string

    const imagesPayload = input.imagePaths.map((imageUrl, index) => ({
      product_id: productId,
      image_url: imageUrl,
      storage_path: input.imageStoragePaths?.[index] || null,
      sort_order: index,
      is_primary: index === 0,
    }))

    if (imagesPayload.length > 0) {
      const { error: imagesError } = await supabaseClient.from('product_images').insert(imagesPayload)
      if (imagesError) throw imagesError
    }

    await refreshProducts(userId)
    return productId
  }

  const updateProduct = async (id: ProductId, input: ProductFormInput) => {
    if (!userId) throw new Error('You must be logged in.')

    const lookup = lookupMaps || (await fetchLookupMaps())
    if (!lookupMaps) setLookupMaps(lookup)

    const categoryDbId = lookup.dbCategoryByApp[input.category]
    if (!categoryDbId) {
      throw new Error('Category mapping was not found in database. Check categories table.')
    }

    const governorateId = lookup.governorateByName.get(normalizeText(input.city)) || null
    const cityId = governorateId ? lookup.cityByGovernorateAndName.get(cityKey(governorateId, input.location)) || null : null
    const vendorProfileId = await getOrCreateVendorProfileId(userId)
    await syncVendorContact(vendorProfileId, input, governorateId, cityId)

    const { error: updateError } = await supabaseClient
      .from('products')
      .update({
        category_id: categoryDbId,
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

    if (updateError) throw updateError

    const productId = String(id)

    const { error: deleteImagesError } = await supabaseClient.from('product_images').delete().eq('product_id', productId)
    if (deleteImagesError) throw deleteImagesError

    const imagesPayload = input.imagePaths.map((imageUrl, index) => ({
      product_id: productId,
      image_url: imageUrl,
      storage_path: input.imageStoragePaths?.[index] || null,
      sort_order: index,
      is_primary: index === 0,
    }))

    if (imagesPayload.length > 0) {
      const { error: imagesError } = await supabaseClient.from('product_images').insert(imagesPayload)
      if (imagesError) throw imagesError
    }

    await refreshProducts(userId)
  }

  const updateProductStatus = async (id: ProductId, status: ProductStatus) => {
    if (!userId) throw new Error('You must be logged in.')

    const { error } = await supabaseClient.from('products').update({ status }).eq('id', String(id))
    if (error) throw error

    await refreshProducts(userId)
  }

  const deleteProduct = async (id: ProductId) => {
    if (!userId) throw new Error('You must be logged in.')

    const productId = String(id)

    const { error: deleteImagesError } = await supabaseClient.from('product_images').delete().eq('product_id', productId)
    if (deleteImagesError) throw deleteImagesError

    const { error: deleteProductError } = await supabaseClient.from('products').delete().eq('id', productId)
    if (deleteProductError) throw deleteProductError

    await refreshProducts(userId)
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
