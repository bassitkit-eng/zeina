'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useProducts } from '@/app/contexts/ProductsContext'
import { AppHeader } from '@/components/shared/AppHeader'
import { FavoriteIconButton } from '@/components/shared/FavoriteIconButton'
import { CATEGORY_NAMES } from '@/lib/catalog'
import { Instagram, MessageCircle, Phone, Facebook, Music2 } from 'lucide-react'

export default function ProductPage() {
  const { allProducts } = useProducts()
  const params = useParams()
  const productId = String(params.id)
  const product = allProducts.find((p) => String(p.id) === productId)

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

  const phone = product.contactInfo?.phone?.trim() || ''
  const whatsapp = product.contactInfo?.whatsapp?.trim() || ''
  const instagram = product.contactInfo?.instagram?.trim() || ''
  const facebook = product.contactInfo?.facebook?.trim() || ''
  const tiktok = product.contactInfo?.tiktok?.trim() || ''
  const hasContact = Boolean(phone || whatsapp || instagram || facebook || tiktok)
  const subcategoryLabel = product.productType && product.productType !== 'عام' ? product.productType : '-'

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
                {!hasContact && <p className="text-[#6B7280]">لا توجد وسائل تواصل مضافة لهذا المنتج.</p>}
                <div className="space-y-3">
                  {phone && (
                    <a href={`tel:${phone}`} className="w-full h-14 rounded-xl text-white text-lg font-bold bg-[#111827] flex items-center justify-center gap-2">
                      <Phone size={20} />
                      {phone}
                    </a>
                  )}
                  {whatsapp && (
                    <a href={`https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer" className="w-full h-14 rounded-xl text-white text-lg font-bold bg-gradient-to-r from-[#29C75F] to-[#11998E] flex items-center justify-center gap-2">
                      <MessageCircle size={20} />
                      تواصل عبر واتساب
                    </a>
                  )}
                  {instagram && (
                    <a href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="w-full h-14 rounded-xl text-white text-lg font-bold bg-gradient-to-r from-[#E1306C] to-[#C13584] flex items-center justify-center gap-2">
                      <Instagram size={20} />
                      تابع على إنستجرام
                    </a>
                  )}
                  {facebook && (
                    <a href={facebook.startsWith('http') ? facebook : `https://${facebook}`} target="_blank" rel="noreferrer" className="w-full h-14 rounded-xl text-white text-lg font-bold bg-[#1877F2] flex items-center justify-center gap-2">
                      <Facebook size={20} />
                      تابع على فيسبوك
                    </a>
                  )}
                  {tiktok && (
                    <a href={tiktok.startsWith('http') ? tiktok : `https://www.tiktok.com/@${tiktok.replace(/^@/, '')}`} target="_blank" rel="noreferrer" className="w-full h-14 rounded-xl text-white text-lg font-bold bg-[#111827] flex items-center justify-center gap-2">
                      <Music2 size={20} />
                      تابع على تيك توك
                    </a>
                  )}
                </div>
              </div>

              <div className="border-t border-[#D1D5DB] pt-6">
                <h3 className="text-3xl font-bold text-[#374151] mb-4">تفاصيل إضافية</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-lg">
                  <p className="text-[#6B7280]">التصنيف الفرعي: <span className="text-[#374151] font-semibold">{subcategoryLabel}</span></p>
                  <p className="text-[#6B7280]">تاريخ الإضافة: <span className="text-[#374151] font-semibold">غير محدد</span></p>
                  <p className="text-[#6B7280]">النوع: <span className="text-[#374151] font-semibold">{subcategoryLabel}</span></p>
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
