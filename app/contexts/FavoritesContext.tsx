'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface FavoritesContextType {
  favorites: number[]
  toggleFavorite: (productId: number) => void
  isFavorite: (productId: number) => boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<number[]>([])
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

  const toggleFavorite = (productId: number) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    )
  }

  const isFavorite = (productId: number) => favorites.includes(productId)

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
