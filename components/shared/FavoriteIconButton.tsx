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
      <span className={`text-xl leading-none transition ${favorite ? 'text-[#C8A97E]' : 'text-[#8A8A8A]'}`}>{favorite ? '♥' : '♡'}</span>
    </button>
  )
}
