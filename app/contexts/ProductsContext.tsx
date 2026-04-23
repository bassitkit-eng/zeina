'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ALL_PRODUCTS, type CategoryId, type Product, type ProductContactInfo, type ProductStatus } from '@/lib/catalog'

const CUSTOM_PRODUCTS_KEY = 'zeina_custom_products'

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

interface ProductsContextType {
  allProducts: Product[]
  productsByCategory: Record<CategoryId, Product[]>
  customProducts: Product[]
  addProduct: (input: ProductFormInput) => number
  updateProduct: (id: number, input: ProductFormInput) => void
  updateProductStatus: (id: number, status: ProductStatus) => void
  deleteProduct: (id: number) => void
}

const ProductsContext = createContext<ProductsContextType | undefined>(undefined)

const baseProductsByCategory: Record<CategoryId, Product[]> = {
  kosha: ALL_PRODUCTS.filter((p) => p.category === 'kosha'),
  mirrors: ALL_PRODUCTS.filter((p) => p.category === 'mirrors'),
  cakes: ALL_PRODUCTS.filter((p) => p.category === 'cakes'),
}

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const [customProducts, setCustomProducts] = useState<Product[]>([])
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const raw = localStorage.getItem(CUSTOM_PRODUCTS_KEY)
    if (!raw) return
    try {
      const parsed = JSON.parse(raw) as Product[]
      if (Array.isArray(parsed)) {
        setCustomProducts(parsed)
      }
    } catch {
      localStorage.removeItem(CUSTOM_PRODUCTS_KEY)
    }
  }, [])

  useEffect(() => {
    if (!isClient) return
    localStorage.setItem(CUSTOM_PRODUCTS_KEY, JSON.stringify(customProducts))
  }, [customProducts, isClient])

  const addProduct = (input: ProductFormInput) => {
    const newId = Date.now()
    const primaryImage = input.imagePaths[0] || ''
    const product: Product = {
      id: newId,
      imagePath: primaryImage,
      imagePaths: input.imagePaths,
      imageStoragePaths: input.imageStoragePaths || [],
      ...input,
    }
    setCustomProducts((prev) => [product, ...prev])
    return newId
  }

  const updateProduct = (id: number, input: ProductFormInput) => {
    const primaryImage = input.imagePaths[0] || ''
    setCustomProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              ...input,
              imagePath: primaryImage,
              imagePaths: input.imagePaths,
              imageStoragePaths: input.imageStoragePaths || [],
            }
          : product
      )
    )
  }

  const updateProductStatus = (id: number, status: ProductStatus) => {
    setCustomProducts((prev) => prev.map((product) => (product.id === id ? { ...product, status } : product)))
  }

  const deleteProduct = (id: number) => {
    setCustomProducts((prev) => prev.filter((product) => product.id !== id))
  }

  const visibleCustomProducts = useMemo(
    () => customProducts.filter((product) => (product.status || 'published') === 'published'),
    [customProducts]
  )

  const allProducts = useMemo(() => [...ALL_PRODUCTS, ...visibleCustomProducts], [visibleCustomProducts])

  const productsByCategory = useMemo<Record<CategoryId, Product[]>>(
    () => ({
      kosha: [...baseProductsByCategory.kosha, ...visibleCustomProducts.filter((p) => p.category === 'kosha')],
      mirrors: [...baseProductsByCategory.mirrors, ...visibleCustomProducts.filter((p) => p.category === 'mirrors')],
      cakes: [...baseProductsByCategory.cakes, ...visibleCustomProducts.filter((p) => p.category === 'cakes')],
    }),
    [visibleCustomProducts]
  )

  return (
    <ProductsContext.Provider
      value={{
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
