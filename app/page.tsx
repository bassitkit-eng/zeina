'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useFavorites } from './contexts/FavoritesContext'
import { CATEGORIES, PRODUCTS_BY_CATEGORY, type CategoryId } from '@/lib/catalog'

function FavoriteButton({ productId }: { productId: number }) {
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
        toggleFavorite(productId)
      }}
      className="w-full mt-3 py-2 border-2 border-[#C8A97E] rounded-lg font-medium transition flex items-center justify-center gap-2"
      style={{
        backgroundColor: favorite ? '#C8A97E' : 'transparent',
        color: favorite ? 'white' : '#C8A97E',
      }}
    >
      <span>{favorite ? '♥' : '♡'}</span>
      <span>{favorite ? 'مضاف للمفضلة' : 'أضف للمفضلة'}</span>
    </button>
  )
}

export default function Home() {
  const { favorites } = useFavorites()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <header className="bg-white border-b-2 border-[#E5E5E5] sticky top-0 z-50" dir="rtl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-3xl font-bold text-[#C8A97E]">
            زينة
          </Link>

          <nav className="flex gap-8 items-center">
            <Link href="/" className="text-[#1F1F1F] hover:text-[#C8A97E] transition font-semibold">
              الرئيسية
            </Link>
            <Link href="/category/kosha" className="text-[#1F1F1F] hover:text-[#C8A97E] transition font-semibold">
              كوشات
            </Link>
            <Link href="/category/mirrors" className="text-[#1F1F1F] hover:text-[#C8A97E] transition font-semibold">
              المرايا
            </Link>
            <Link href="/category/cakes" className="text-[#1F1F1F] hover:text-[#C8A97E] transition font-semibold">
              الكعك
            </Link>
            <Link
              href="/favorites"
              className="px-6 py-2 border-2 border-[#C8A97E] text-[#C8A97E] rounded-lg font-medium hover:bg-[#C8A97E] hover:text-white transition flex items-center gap-2 relative"
            >
              <span>♥</span>
              <span>المفضلة</span>
              {isClient && favorites.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#C8A97E] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {favorites.length}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <section className="px-4 py-16 md:py-24 text-center" dir="rtl">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-[#C8A97E] mb-4">زينة</h1>
          <p className="text-lg text-[#6B6B6B] mb-8">اكتشف جوهر مستلزمات الأفراح المختارة بعناية لتحقيق حلمك</p>
          <div className="flex gap-4 justify-center">
            <button className="px-8 py-3 bg-[#C8A97E] text-white rounded-lg font-medium hover:opacity-90 transition">تصفح الآن</button>
            <button className="px-8 py-3 border-2 border-[#C8A97E] text-[#C8A97E] rounded-lg font-medium hover:bg-[#C8A97E] hover:text-white transition">تعرف أكثر</button>
          </div>
        </div>
      </section>

      <section className="px-4 py-12" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1F1F1F] mb-12 text-center">تسوق حسب الفئة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CATEGORIES.map((category) => (
              <Link key={category.id} href={`/category/${category.id}`}>
                <div className="cursor-pointer group">
                  <div className="relative h-64 bg-gray-200 rounded-lg overflow-hidden mb-4">
                    <div className="w-full h-full bg-gradient-to-br from-[#C8A97E]/20 to-[#C8A97E]/5 flex items-center justify-center">
                      <span className="text-[#C8A97E] text-6xl">✦</span>
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-[#1F1F1F] group-hover:text-[#C8A97E] transition">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {Object.entries(PRODUCTS_BY_CATEGORY).map(([categoryId, products]) => {
        const typedCategoryId = categoryId as CategoryId
        const categoryName = CATEGORIES.find((c) => c.id === typedCategoryId)?.name ?? ''

        return (
          <section key={typedCategoryId} className="px-4 py-12" dir="rtl">
            <div className="max-w-6xl mx-auto">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-[#1F1F1F]">{categoryName}</h3>
                <Link href={`/category/${typedCategoryId}`} className="text-[#C8A97E] hover:underline font-medium">
                  عرض الكل ←
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="group">
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
                    <FavoriteButton productId={product.id} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </main>
  )
}
