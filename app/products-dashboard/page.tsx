'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AppHeader } from '@/components/shared/AppHeader'
import { useProducts } from '@/app/contexts/ProductsContext'
import { CATEGORIES, type ProductStatus } from '@/lib/catalog'

const STATUS_OPTIONS: Array<{ value: ProductStatus | 'all'; label: string }> = [
  { value: 'all', label: 'كل الحالات' },
  { value: 'published', label: 'منشور' },
  { value: 'draft', label: 'مسودة' },
  { value: 'hidden', label: 'مخفي' },
  { value: 'soldout', label: 'نفد' },
]

const STATUS_LABEL: Record<ProductStatus, string> = {
  draft: 'مسودة',
  published: 'منشور',
  hidden: 'مخفي',
  soldout: 'نفد',
}

export default function ProductsDashboardPage() {
  const { customProducts, updateProductStatus, deleteProduct } = useProducts()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'kosha' | 'mirrors' | 'cakes'>('all')

  const filteredProducts = useMemo(
    () =>
      customProducts.filter((product) => {
        const matchesSearch =
          !search.trim() ||
          product.name.toLowerCase().includes(search.toLowerCase()) ||
          product.location.toLowerCase().includes(search.toLowerCase()) ||
          product.city.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = statusFilter === 'all' || (product.status || 'draft') === statusFilter
        const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
        return matchesSearch && matchesStatus && matchesCategory
      }),
    [customProducts, search, statusFilter, categoryFilter]
  )

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />

      <section className="zeina-halo-section px-4 py-10" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#1F1F1F]">لوحة المنتجات</h1>
          <p className="text-[#6B6B6B] mt-2">بحث، فلترة، إدارة الحالات، تعديل وحذف المنتجات المضافة.</p>
        </div>
      </section>

      <section className="px-4 py-8" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث باسم المنتج أو المدينة..."
              className="h-11 rounded-lg border border-[#DCCAB2] px-3"
            />

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProductStatus | 'all')} className="h-11 rounded-lg border border-[#DCCAB2] px-3">
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'kosha' | 'mirrors' | 'cakes')} className="h-11 rounded-lg border border-[#DCCAB2] px-3">
              <option value="all">كل التصنيفات</option>
              {CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <Link href="/add-product" className="h-11 rounded-lg bg-[#7B57C8] text-white font-bold flex items-center justify-center">
              + إضافة منتج جديد
            </Link>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white border border-[#E5E7EB] rounded-2xl p-10 text-center text-[#6B7280]">لا توجد نتائج مطابقة.</div>
          ) : (
            <div className="space-y-3">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border border-[#E5E7EB] rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <img src={product.imagePath} alt={product.name} className="h-24 w-24 rounded-md object-cover" />
                    <div className="flex-1">
                      <p className="font-bold text-[#111827]">{product.name}</p>
                      <p className="text-sm text-[#6B7280]">{product.city} - {product.location}</p>
                      <p className="text-sm text-[#6B7280]">{product.productType}</p>
                      <p className="text-sm font-semibold text-[#C8A97E]">EGP {product.price}</p>
                    </div>

                    <div className="flex flex-col gap-2 md:w-[180px]">
                      <select
                        value={product.status || 'draft'}
                        onChange={(e) => updateProductStatus(product.id, e.target.value as ProductStatus)}
                        className="h-10 rounded-lg border border-[#DCCAB2] px-2 text-sm"
                      >
                        <option value="draft">مسودة</option>
                        <option value="published">منشور</option>
                        <option value="hidden">مخفي</option>
                        <option value="soldout">نفد</option>
                      </select>
                      <span className="text-xs text-[#6B7280] text-center">الحالة الحالية: {STATUS_LABEL[product.status || 'draft']}</span>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/add-product?edit=${product.id}`} className="h-10 px-3 rounded-lg bg-[#F3EBDD] text-[#7A5E37] text-sm font-semibold flex items-center">
                        تعديل
                      </Link>
                      <button
                        onClick={() => {
                          if (!window.confirm('هل أنت متأكد من حذف المنتج؟')) return
                          deleteProduct(product.id)
                        }}
                        className="h-10 px-3 rounded-lg bg-[#FEE2E2] text-[#B91C1C] text-sm font-semibold"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

