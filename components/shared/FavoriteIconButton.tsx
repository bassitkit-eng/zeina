'use client'

import { useEffect, useState } from 'react'
import { useFavorites } from '@/app/contexts/FavoritesContext'

interface FavoriteIconButtonProps {
  productId: number
  className?: string
}

export function FavoriteIconButton({ productId, className = '' }: FavoriteIconButtonProps) {
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
      className={`absolute top-3 right-3 z-10 h-10 w-10 rounded-full border border-white/70 bg-white/90 shadow-sm backdrop-blur-sm flex items-center justify-center transition hover:scale-105 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className={`h-5 w-5 transition ${favorite ? 'fill-[#C8A97E] text-[#C8A97E]' : 'fill-none text-[#8A8A8A]'}`}
        aria-hidden="true"
      >
        <path
          d="M12 20.25c-.3 0-.6-.1-.84-.3C7.14 16.5 4 13.86 4 10.5 4 8.02 6.02 6 8.5 6c1.4 0 2.72.65 3.5 1.72A4.47 4.47 0 0 1 15.5 6C17.98 6 20 8.02 20 10.5c0 3.36-3.14 6-7.16 9.45-.24.2-.54.3-.84.3Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
