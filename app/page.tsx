'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useFavorites } from './contexts/FavoritesContext'
import { CATEGORIES, PRODUCTS_BY_CATEGORY, type CategoryId } from '@/lib/catalog'

const HERO_SLIDES = [
  {
    title: 'لأن لحظاتك تستحق الأفضل',
    description:
      'في زينة نهتم بالجودة والتفاصيل، لتجد منتجات تعكس شخصيتك وتترك أثرًا لا يُنسى في مناسبتك الخاصة.',
  },
  {
    title: 'تنوع يلبي كل الأذواق',
    description:
      'من الكوشات الفخمة إلى المرايا والدعوات الأنيقة، نوفر لك خيارات واسعة تناسب جميع الأذواق والمناسبات.',
  },
  {
    title: 'زينة.. لمناسبات تبقى في الذاكرة',
    description:
      'ابدأ رحلتك الآن مع زينة، واختر من بين أجمل المنتجات لتصنع لحظاتك المميزة.',
  },
]

const CATEGORY_IMAGES = {
  kosha: '/images/koshat.jpg',
  mirrors: '/images/mirr.jpg',
  cakes: '/images/cake.jpg',
}

const CATEGORY_CARD_COPY = {
  kosha: {
    title: 'كوشات',
    subtitle: 'تصاميم فريدة لحفلاتكم',
  },
  mirrors: {
    title: 'مرايا',
    subtitle: 'لمسات أنيقة تزيد سحر المكان',
  },
  cakes: {
    title: 'تورتات وأنواع الشوكولاتة',
    subtitle: 'تورتات وشوكولاتة مخصصة ومميزة',
  },
}

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

export default function Home() {
  const { favorites } = useFavorites()
  const [isClient, setIsClient] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 3500)

    return () => clearInterval(intervalId)
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
              تورتات
            </Link>
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

      <section className="px-4 py-24 md:py-36 text-center bg-[#F4EEF2] border-y border-[#E8DDE4]" dir="rtl">
        <div className="max-w-4xl mx-auto">
          <div className="relative min-h-[220px] md:min-h-[200px]">
            {HERO_SLIDES.map((slide, index) => (
              <div
                key={slide.title}
                className={`absolute inset-0 transition-all duration-700 ${
                  currentSlide === index
                    ? 'opacity-100 translate-x-0'
                    : index < currentSlide
                      ? 'opacity-0 -translate-x-8 pointer-events-none'
                      : 'opacity-0 translate-x-8 pointer-events-none'
                }`}
              >
                <h1 className="text-4xl md:text-6xl font-bold text-[#1F2A3A] mb-6">{slide.title}</h1>
                <p className="text-lg md:text-2xl leading-relaxed text-[#4B5563]">{slide.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2">
            {HERO_SLIDES.map((slide, index) => (
              <button
                key={`dot-${slide.title}`}
                aria-label={`عرض النص رقم ${index + 1}`}
                onClick={() => setCurrentSlide(index)}
                className={`h-2.5 rounded-full transition-all ${
                  currentSlide === index ? 'w-7 bg-[#C8A97E]' : 'w-2.5 bg-[#C8A97E]/40'
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-[#C8A97E] mb-12 text-center">تصفح التصنيفات</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {CATEGORIES.map((category) => (
              <Link key={category.id} href={`/category/${category.id}`}>
                <div className="cursor-pointer group">
                  <div className="relative h-64 rounded-lg overflow-hidden mb-2">
                    <Image
                      src={CATEGORY_IMAGES[category.id]}
                      alt={category.name}
                      fill
                      className="object-cover transition duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black/75 via-black/35 to-transparent text-white">
                      <h3 className="text-2xl md:text-3xl font-bold mb-1">{CATEGORY_CARD_COPY[category.id].title}</h3>
                      <p className="text-sm md:text-base text-white/90">{CATEGORY_CARD_COPY[category.id].subtitle}</p>
                    </div>
                  </div>
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
        )
      })}
    </main>
  )
}
