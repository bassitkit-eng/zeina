'use client'

import { useEffect, useState } from 'react'
import { useFavorites } from '@/app/contexts/FavoritesContext'
import type { ProductId } from '@/lib/catalog'

interface FavoriteTextButtonProps {
  productId: ProductId
}

export function FavoriteTextButton({ productId }: FavoriteTextButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  const favorite = isFavorite(productId)

  return (
    <button
      onClick={() => toggleFavorite(productId)}
      className="flex-1 px-8 py-3 border-2 border-[#C8A97E] rounded-lg font-medium transition flex items-center justify-center gap-2"
      style={{
        backgroundColor: favorite ? '#C8A97E' : 'transparent',
        color: favorite ? 'white' : '#C8A97E',
      }}
    >
      <span>{favorite ? '♥' : '♡'}</span>
      <span>{favorite ? 'مضاف للمفضلة' : 'أضف للمفضلة'}</span>
    </button>
  )
}
