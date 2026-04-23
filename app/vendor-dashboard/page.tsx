'use client'

import Link from 'next/link'
import { AppHeader } from '@/components/shared/AppHeader'
import { useProducts } from '@/app/contexts/ProductsContext'
import { CATEGORIES } from '@/lib/catalog'

export default function VendorDashboardPage() {
  const { customProducts } = useProducts()

  const publishedCount = customProducts.filter((p) => p.status === 'published').length
  const draftCount = customProducts.filter((p) => p.status === 'draft' || !p.status).length
  const soldOutCount = customProducts.filter((p) => p.status === 'soldout').length

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />
      <section className="px-4 py-12" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-6">لوحة البائع</h1>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <p className="text-sm text-[#6B7280]">إجمالي المنتجات</p>
              <p className="text-3xl font-bold text-[#1F1F1F] mt-1">{customProducts.length}</p>
            </div>
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <p className="text-sm text-[#6B7280]">منتجات منشورة</p>
              <p className="text-3xl font-bold text-[#16A34A] mt-1">{publishedCount}</p>
            </div>
            <div className="rounded-xl bg-white border border-[#E5E7EB] p-4">
              <p className="text-sm text-[#6B7280]">مسودات / نفدت</p>
              <p className="text-3xl font-bold text-[#B45309] mt-1">{draftCount + soldOutCount}</p>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#E5E7EB] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold text-[#1F1F1F]">منتجاتي</h2>
              <Link href="/add-product" className="h-10 px-4 rounded-lg bg-[#7B57C8] text-white font-bold inline-flex items-center">
                إضافة منتج جديد
              </Link>
            </div>

            {customProducts.length === 0 ? (
              <p className="text-[#6B7280]">لا توجد منتجات بعد.</p>
            ) : (
              <div className="space-y-3">
                {customProducts.map((product) => (
                  <div key={product.id} className="rounded-xl border border-[#E5E7EB] p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-[#1F1F1F] truncate">{product.name}</p>
                      <p className="text-sm text-[#6B7280]">
                        {CATEGORIES.find((c) => c.id === product.category)?.name} - {product.city} - {product.location}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-[#C8A97E]">EGP {product.price}</p>
                      <p className="text-xs text-[#6B7280]">
                        {product.status === 'published' ? 'منشور' : product.status === 'hidden' ? 'مخفي' : product.status === 'soldout' ? 'نفد' : 'مسودة'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

