'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppHeader } from '@/components/shared/AppHeader'
import { ProductGridCard } from '@/components/shared/ProductGridCard'
import { useFavorites } from '../contexts/FavoritesContext'
import { ALL_PRODUCTS } from '@/lib/catalog'

export default function FavoritesPage() {
  const { favorites } = useFavorites()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const favoriteProducts = ALL_PRODUCTS.filter((product) => favorites.includes(product.id))

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />

      <section className="zeina-halo-section px-4 py-12" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#1F1F1F] mb-2">المفضلة</h1>
          <p className="text-[#6B6B6B]">
            {isClient && favoriteProducts.length > 0
              ? `لديك ${favoriteProducts.length} منتج في المفضلة`
              : 'لا توجد منتجات في المفضلة بعد'}
          </p>
        </div>
      </section>

      {isClient && favoriteProducts.length === 0 ? (
        <section className="px-4 py-20" dir="rtl">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-6">
              <span className="text-6xl">♡</span>
            </div>
            <h2 className="text-3xl font-bold text-[#1F1F1F] mb-3">لا توجد منتجات في المفضلة بعد</h2>
            <p className="text-[#6B6B6B] mb-8 max-w-md mx-auto">ابدأ بإضافة منتجاتك المفضلة لتتمكن من الوصول إليها بسهولة لاحقًا</p>
            <Link href="/" className="inline-block px-8 py-3 bg-[#C8A97E] text-white rounded-lg font-medium hover:opacity-90 transition">
              استكشف المنتجات
            </Link>
          </div>
        </section>
      ) : (
        <section className="px-4 py-8" dir="rtl">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {favoriteProducts.map((product) => (
                <ProductGridCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
