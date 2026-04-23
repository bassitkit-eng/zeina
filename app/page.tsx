'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AppHeader } from '@/components/shared/AppHeader'
import { ProductGridCard } from '@/components/shared/ProductGridCard'
import { CATEGORIES, PRODUCTS_BY_CATEGORY, type CategoryId } from '@/lib/catalog'
import { CATEGORY_CARD_COPY, CATEGORY_IMAGES, HERO_SLIDES } from '@/features/home/constants'

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length)
    }, 3500)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />

      <section className="zeina-halo-section px-4 py-24 md:py-36 text-center" dir="rtl">
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
                className={`h-2.5 rounded-full transition-all ${currentSlide === index ? 'w-7 bg-[#C8A97E]' : 'w-2.5 bg-[#C8A97E]/40'}`}
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
                  <ProductGridCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>
        )
      })}
    </main>
  )
}
