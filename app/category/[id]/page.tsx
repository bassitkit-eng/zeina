'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useFavorites } from '@/app/contexts/FavoritesContext'
import { CATEGORY_NAMES, PRODUCTS_BY_CATEGORY, type CategoryId } from '@/lib/catalog'

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

export default function CategoryPage() {
  const params = useParams()
  const categoryId = params.id as CategoryId
  const products = PRODUCTS_BY_CATEGORY[categoryId] || []

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <section className="px-4 py-12" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <Link href="/" className="text-[#C8A97E] hover:underline mb-6 inline-block">
            ← العودة للرئيسية
          </Link>
          <h1 className="text-4xl font-bold text-[#1F1F1F]">{CATEGORY_NAMES[categoryId]}</h1>
          <p className="text-[#6B6B6B] mt-2">عرض {products.length} منتجات</p>
        </div>
      </section>

      <section className="px-4 py-8" dir="rtl">
        <div className="max-w-6xl mx-auto">
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
    </main>
  )
}
