'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { AppHeader } from '@/components/shared/AppHeader'
import { ProductGridCard } from '@/components/shared/ProductGridCard'
import { CATEGORY_NAMES, PRODUCTS_BY_CATEGORY, type CategoryId } from '@/lib/catalog'

export default function CategoryPage() {
  const params = useParams()
  const categoryId = params.id as CategoryId
  const products = PRODUCTS_BY_CATEGORY[categoryId] || []

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />

      <section className="zeina-halo-section px-4 py-12" dir="rtl">
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
              <ProductGridCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
