'use client'

import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { useProducts } from '@/app/contexts/ProductsContext'
import { AppHeader } from '@/components/shared/AppHeader'
import { ProductGridCard } from '@/components/shared/ProductGridCard'
import { CATEGORY_NAMES, type CategoryId } from '@/lib/catalog'

export default function CategoryPage() {
  const { productsByCategory } = useProducts()
  const params = useParams()
  const categoryId = params.id as CategoryId
  const products = productsByCategory[categoryId] || []

  const [selectedLocation, setSelectedLocation] = useState('all')
  const [selectedCity, setSelectedCity] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')

  const locationOptions = useMemo(() => ['all', ...Array.from(new Set(products.map((product) => product.location)))], [products])
  const cityOptions = useMemo(() => ['all', ...Array.from(new Set(products.map((product) => product.city)))], [products])
  const typeOptions = useMemo(() => ['all', ...Array.from(new Set(products.map((product) => product.productType)))], [products])

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const matchesLocation = selectedLocation === 'all' || product.location === selectedLocation
        const matchesCity = selectedCity === 'all' || product.city === selectedCity
        const matchesType = selectedType === 'all' || product.productType === selectedType
        const parsedMin = minPrice ? Number(minPrice) : null
        const parsedMax = maxPrice ? Number(maxPrice) : null
        const matchesMin = parsedMin === null || product.price >= parsedMin
        const matchesMax = parsedMax === null || product.price <= parsedMax
        return matchesLocation && matchesCity && matchesType && matchesMin && matchesMax
      }),
    [products, selectedLocation, selectedCity, selectedType, minPrice, maxPrice]
  )

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />

      <section className="zeina-halo-section px-4 py-12" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#1F1F1F]">{CATEGORY_NAMES[categoryId]}</h1>
          <p className="text-[#6B6B6B] mt-2">عرض {filteredProducts.length} منتجات</p>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label htmlFor="location-filter" className="block mb-2 text-sm font-semibold text-[#1F1F1F]">
                فلترة حسب المكان
              </label>
              <select
                id="location-filter"
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              >
                {locationOptions.map((location) => (
                  <option key={location} value={location}>
                    {location === 'all' ? 'كل الأماكن' : location}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city-filter" className="block mb-2 text-sm font-semibold text-[#1F1F1F]">
                فلترة حسب المدينة
              </label>
              <select
                id="city-filter"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              >
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city === 'all' ? 'كل المدن' : city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type-filter" className="block mb-2 text-sm font-semibold text-[#1F1F1F]">
                فلترة حسب النوع
              </label>
              <select
                id="type-filter"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              >
                {typeOptions.map((type) => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'كل الأنواع' : type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">فلترة حسب السعر</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="من"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="إلى"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  setSelectedLocation('all')
                  setSelectedCity('all')
                  setSelectedType('all')
                  setMinPrice('')
                  setMaxPrice('')
                }}
                className="h-11 w-full rounded-lg border border-[#C8A97E] text-[#C8A97E] font-medium hover:bg-[#C8A97E] hover:text-white transition"
              >
                إعادة تعيين الفلاتر
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-8" dir="rtl">
        <div className="max-w-6xl mx-auto">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-2">لا توجد نتائج مطابقة</h2>
              <p className="text-[#6B6B6B]">جرّب تغيير الفلاتر أو إعادة تعيينها.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductGridCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

