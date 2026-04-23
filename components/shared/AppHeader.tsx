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

          <Link
            href="/add-product"
            className="h-10 px-4 rounded-xl bg-[#7B57C8] text-white font-bold flex items-center justify-center gap-2 border border-[#6E4DB5] shadow-sm hover:bg-[#6E4DB5] transition"
          >
            <span className="text-xl leading-none">+</span>
            <span>أضف منتجك</span>
          </Link>

          <Link
            href="/favorites"
            aria-label="المفضلة"
            className="h-11 w-11 border-2 border-[#C8A97E] text-[#C8A97E] rounded-full font-medium hover:bg-[#C8A97E] hover:text-white transition flex items-center justify-center relative"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current" aria-hidden="true">
              <path d="M12 20.25c-.3 0-.6-.1-.84-.3C7.14 16.5 4 13.86 4 10.5 4 8.02 6.02 6 8.5 6c1.4 0 2.72.65 3.5 1.72A4.47 4.47 0 0 1 15.5 6C17.98 6 20 8.02 20 10.5c0 3.36-3.14 6-7.16 9.45-.24.2-.54.3-.84.3Z" />
            </svg>
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

