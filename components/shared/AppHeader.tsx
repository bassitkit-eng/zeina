'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useFavorites } from '@/app/contexts/FavoritesContext'
import { CATEGORIES } from '@/lib/catalog'

export function AppHeader() {
  const { favorites } = useFavorites()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  return (
    <header className="bg-white border-b-2 border-[#E5E5E5] sticky top-0 z-50" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-3xl font-bold text-[#C8A97E]">
          زينة
        </Link>

        <nav className="flex gap-8 items-center">
          <Link href="/" className="text-[#1F1F1F] hover:text-[#C8A97E] transition font-semibold">
            الرئيسية
          </Link>

          {CATEGORIES.map((category) => (
            <Link key={category.id} href={`/category/${category.id}`} className="text-[#1F1F1F] hover:text-[#C8A97E] transition font-semibold">
              {category.name}
            </Link>
          ))}

          <Link href="/add-product" className="text-[#1F1F1F] hover:text-[#C8A97E] transition font-semibold">
            إضافة منتج
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
  )
}
