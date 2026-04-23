'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import type { ProductId } from '@/lib/catalog'

interface FavoritesContextType {
  favorites: ProductId[]
  toggleFavorite: (productId: ProductId) => void
  isFavorite: (productId: ProductId) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<ProductId[]>([])
  const [isClient, setIsClient] = useState(false)

  // Load favorites from localStorage on mount
  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem('zeina_favorites')
    if (saved) {
      setFavorites(JSON.parse(saved))
    }
  }, [])

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('zeina_favorites', JSON.stringify(favorites))
    }
  }, [favorites, isClient])

  const toggleFavorite = (productId: ProductId) => {
    setFavorites((prev) =>
      prev.some((id) => String(id) === String(productId))
        ? prev.filter((id) => String(id) !== String(productId))
        : [...prev, productId]
    )
  }

  const isFavorite = (productId: ProductId) => favorites.some((id) => String(id) === String(productId))

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error('useFavorites must be used within FavoritesProvider')
  }
  return context
}
