'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useProducts } from '@/app/contexts/ProductsContext'
import { AppHeader } from '@/components/shared/AppHeader'
import { FavoriteIconButton } from '@/components/shared/FavoriteIconButton'
import { CATEGORY_NAMES } from '@/lib/catalog'

export default function ProductPage() {
  const { allProducts } = useProducts()
  const params = useParams()
  const productId = parseInt(params.id as string, 10)
  const product = allProducts.find((p) => p.id === productId)

  if (!product) {
    return (
      <main className="min-h-screen bg-[#F3F4F6]">
        <AppHeader />
        <section className="px-4 py-16" dir="rtl">
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
    <main className="min-h-screen bg-[#F3F4F6]">
      <AppHeader />

      <section className="px-4 py-6" dir="rtl">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6 items-start">
            <div className="order-2 bg-transparent rounded-xl">
              <h1 className="text-4xl font-bold text-[#111827] mb-6">{CATEGORY_NAMES[product.category]}</h1>

              <p className="text-5xl font-extrabold text-[#C8A97E] mb-8">السعر عند الطلب</p>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#374151] mb-2">وصف المنتج</h2>
                <p className="text-[#6B7280] text-lg leading-relaxed">{product.description || '-'}</p>
              </div>

              <div className="mb-8">
                <h2 className="text-3xl font-bold text-[#374151] mb-2">تواصل مع البائع</h2>
                <p className="text-[#6B7280] mb-4">جميع وسائل التواصل التالية تخص البائع لهذا المنتج.</p>

                <button className="w-full h-16 rounded-xl text-white text-2xl font-bold mb-3 bg-gradient-to-r from-[#29C75F] to-[#11998E]">
                  تواصل عبر واتساب
                </button>
                <button className="w-full h-14 rounded-xl text-white text-xl font-bold bg-gradient-to-r from-[#E1306C] to-[#C13584]">
                  تابع البائع على إنستجرام
                </button>
              </div>

              <div className="border-t border-[#D1D5DB] pt-6">
                <h3 className="text-3xl font-bold text-[#374151] mb-4">تفاصيل إضافية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-lg">
                  <p className="text-[#6B7280]">التصنيف الفرعي: <span className="text-[#374151] font-semibold">{product.name}</span></p>
                  <p className="text-[#6B7280]">تاريخ الإضافة: <span className="text-[#374151] font-semibold">غير محدد</span></p>
                  <p className="text-[#6B7280]">النوع: <span className="text-[#374151] font-semibold">{product.productType}</span></p>
                  <p className="text-[#6B7280]">المحافظات المتوفرة: <span className="text-[#374151] font-semibold">{product.city}</span></p>
                  <p className="text-[#6B7280]">المناطق/المدن المتوفرة: <span className="text-[#374151] font-semibold">{product.location}</span></p>
                </div>
              </div>
            </div>

            <div className="order-1">
              <div className="w-fit ml-auto text-base md:text-lg text-[#6B7280] mb-4 flex items-center justify-end gap-3 text-right" dir="rtl">
                <Link href="/" className="hover:text-[#C8A97E]">الرئيسية</Link>
                <span>/</span>
                <Link href={`/category/${product.category}`} className="hover:text-[#C8A97E]">{CATEGORY_NAMES[product.category]}</Link>
                <span>/</span>
                <span className="text-[#374151]">{product.name}</span>
              </div>

              <div className="relative rounded-2xl overflow-hidden shadow-md bg-white min-h-[540px]">
                <span className="absolute top-4 right-4 z-10 bg-[#22C55E] text-white text-sm font-bold px-3 py-1 rounded-full">منتج</span>
                <FavoriteIconButton productId={product.id} className="top-4 left-4 right-auto" />
                <Image src={product.imagePath} alt={product.name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 45vw" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
