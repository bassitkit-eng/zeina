'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppHeader } from '@/components/shared/AppHeader'
import { FavoriteTextButton } from '@/components/shared/FavoriteTextButton'
import { ALL_PRODUCTS, CATEGORY_NAMES } from '@/lib/catalog'

export default function ProductPage() {
  const params = useParams()
  const productId = parseInt(params.id as string, 10)
  const product = ALL_PRODUCTS.find((p) => p.id === productId)

  if (!product) {
    return (
      <main className="min-h-screen bg-[#FAF9F7]">
        <AppHeader />
        <section className="px-4 py-12" dir="rtl">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-[#1F1F1F] mb-4">المنتج غير موجود</h1>
            <Link href="/" className="text-[#C8A97E] hover:underline">
              العودة للرئيسية
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />
      <section className="zeina-halo-section px-4 py-8" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <Link href={`/category/${product.category}`} className="text-[#C8A97E] hover:underline mb-6 inline-block">
            ← العودة إلى {CATEGORY_NAMES[product.category]}
          </Link>
        </div>
      </section>

      <section className="px-4 py-8" dir="rtl">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="w-full h-96 bg-gradient-to-br from-[#C8A97E]/20 to-[#C8A97E]/5 rounded-lg flex items-center justify-center">
              <span className="text-[#C8A97E] text-6xl">✦</span>
            </div>
          </div>

          <div>
            <h1 className="text-4xl font-bold text-[#1F1F1F] mb-4">{product.name}</h1>

            <div className="mb-6">
              <p className="text-3xl font-bold text-[#C8A97E]">درهم {product.price}</p>
              <p className="text-[#6B6B6B] mt-2">{product.location}</p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-[#1F1F1F] mb-2">الوصف</h3>
              <p className="text-[#6B6B6B] leading-relaxed">{product.description}</p>
            </div>

            <div className="flex gap-4">
              <button className="flex-1 px-8 py-3 bg-[#C8A97E] text-white rounded-lg font-medium hover:opacity-90 transition">
                أضف إلى السلة
              </button>
              <FavoriteTextButton productId={product.id} />
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
