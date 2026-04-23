'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useFavorites } from '../contexts/FavoritesContext'
import { ALL_PRODUCTS, CATEGORIES } from '@/lib/catalog'

function FavoriteIconButton({ productId }: { productId: number }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  const favorite = isFavorite(productId)

  return (
    <button
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleFavorite(productId)
      }}
      aria-label={favorite ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
      className="absolute top-3 right-3 z-10 h-10 w-10 rounded-full border border-white/70 bg-white/90 shadow-sm backdrop-blur-sm flex items-center justify-center transition hover:scale-105"
    >
      <span className={`text-xl leading-none transition ${favorite ? 'text-[#C8A97E]' : 'text-[#8A8A8A]'}`}>
        {favorite ? '♥' : '♡'}
      </span>
    </button>
  )
}

export default function FavoritesPage() {
  const { favorites } = useFavorites()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const favoriteProducts = ALL_PRODUCTS.filter((product) => favorites.includes(product.id))

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b border-[#E5E5E5] sticky top-0 z-50" dir="rtl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold text-[#C8A97E]">
            زينة
          </Link>

          <nav className="flex gap-8 items-center">
            <Link href="/" className="text-[#1F1F1F] hover:text-[#C8A97E] transition font-medium">
              الرئيسية
            </Link>
            {CATEGORIES.map((category) => (
              <Link key={category.id} href={`/category/${category.id}`} className="text-[#1F1F1F] hover:text-[#C8A97E] transition font-medium">
                {category.name}
              </Link>
            ))}
            <Link
              href="/favorites"
              aria-label="المفضلة"
              className="h-11 w-11 border-2 border-[#C8A97E] text-[#C8A97E] rounded-full font-medium hover:bg-[#C8A97E] hover:text-white transition flex items-center justify-center relative"
            >
              <span className="text-2xl leading-none">♥</span>
              {isClient && favorites.length > 0 && (
                <span className="absolute top-0.5 right-0.5 bg-[#C8A97E] text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-4 py-12" dir="rtl">
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
                <div key={product.id} className="group relative">
                  <FavoriteIconButton productId={product.id} />
                  <Link href={`/product/${product.id}`}>
                    <div className="cursor-pointer">
                      <div className="relative h-56 bg-gray-200 rounded-lg overflow-hidden mb-3">
                        <div className="w-full h-full bg-gradient-to-br from-[#C8A97E]/10 to-[#C8A97E]/5 flex items-center justify-center">
                          <span className="text-[#C8A97E] text-4xl">✦</span>
                        </div>
                      </div>
                      <h4 className="font-semibold text-[#1F1F1F] group-hover:text-[#C8A97E] transition mb-2">{product.name}</h4>
                      <p className="text-[#C8A97E] font-bold mb-1">AED {product.price}</p>
                      <p className="text-sm text-[#6B6B6B]">{product.location}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
