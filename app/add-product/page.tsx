'use client'

import { ChangeEvent, useMemo, useState } from 'react'
import { AppHeader } from '@/components/shared/AppHeader'
import { useProducts } from '@/app/contexts/ProductsContext'
import { CATEGORIES, type CategoryId, type Product } from '@/lib/catalog'

type ProductFormState = {
  name: string
  category: CategoryId
  productType: string
  city: string
  location: string
  price: string
  description: string
  imagePath: string
}

const initialForm: ProductFormState = {
  name: '',
  category: 'kosha',
  productType: 'زفاف',
  city: '',
  location: '',
  price: '',
  description: '',
  imagePath: '',
}

export default function AddProductPage() {
  const { customProducts, addProduct, updateProduct, deleteProduct } = useProducts()
  const [form, setForm] = useState<ProductFormState>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const actionLabel = useMemo(() => (editingId ? 'حفظ التعديلات' : 'إضافة المنتج'), [editingId])

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setForm((prev) => ({ ...prev, imagePath: result }))
    }
    reader.readAsDataURL(file)
  }

  const startEditing = (product: Product) => {
    setEditingId(product.id)
    setForm({
      name: product.name,
      category: product.category,
      productType: product.productType,
      city: product.city,
      location: product.location,
      price: String(product.price),
      description: product.description || '',
      imagePath: product.imagePath,
    })
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const resetForm = () => {
    setForm(initialForm)
    setEditingId(null)
    setError('')
  }

  const onSubmit = () => {
    if (!form.name || !form.city || !form.location || !form.price || !form.imagePath) {
      setError('من فضلك أكمل كل الحقول المطلوبة وارفع صورة.')
      return
    }

    const parsedPrice = Number(form.price)
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('السعر يجب أن يكون رقمًا صحيحًا أكبر من صفر.')
      return
    }

    const payload = {
      name: form.name,
      category: form.category,
      productType: form.productType,
      city: form.city,
      location: form.location,
      price: parsedPrice,
      description: form.description,
      imagePath: form.imagePath,
    }

    if (editingId) {
      updateProduct(editingId, payload)
    } else {
      addProduct(payload)
    }

    resetForm()
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />

      <section className="zeina-halo-section px-4 py-10" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#1F1F1F]">إضافة منتج</h1>
          <p className="text-[#6B6B6B] mt-2">من هنا يمكنك إضافة منتج جديد أو تعديل منتجاتك الحالية.</p>
        </div>
      </section>

      <section className="px-4 py-8" dir="rtl">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">{editingId ? 'تعديل المنتج' : 'بيانات المنتج'}</h2>

            <div className="space-y-4">
              <input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="اسم المنتج"
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              />

              <select
                value={form.category}
                onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as CategoryId }))}
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              >
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.productType}
                  onChange={(e) => setForm((prev) => ({ ...prev, productType: e.target.value }))}
                  placeholder="نوع المنتج (زفاف / خطوبة)"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                  placeholder="السعر"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="المدينة"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
                <input
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="المنطقة / المكان"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>

              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="تفاصيل المنتج"
                rows={4}
                className="w-full rounded-lg border border-[#DCCAB2] bg-white p-3 text-[#1F1F1F]"
              />

              <div>
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">صورة المنتج</label>
                <input type="file" accept="image/*" onChange={onFileChange} className="w-full text-sm" />
              </div>

              {form.imagePath && (
                <div className="relative h-56 rounded-lg overflow-hidden border border-[#E5E7EB]">
                  <img src={form.imagePath} alt="معاينة المنتج" className="h-full w-full object-cover" />
                </div>
              )}

              {error && <p className="text-red-600 text-sm">{error}</p>}

              <div className="flex gap-3">
                <button onClick={onSubmit} className="flex-1 h-11 rounded-lg bg-[#C8A97E] text-white font-bold hover:opacity-90 transition">
                  {actionLabel}
                </button>
                {editingId && (
                  <button onClick={resetForm} className="h-11 px-5 rounded-lg border border-[#C8A97E] text-[#C8A97E] font-bold">
                    إلغاء
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">منتجاتي</h2>
            {customProducts.length === 0 ? (
              <p className="text-[#6B6B6B]">لا توجد منتجات مضافة حتى الآن.</p>
            ) : (
              <div className="space-y-3 max-h-[650px] overflow-auto pr-1">
                {customProducts.map((product) => (
                  <div key={product.id} className="border border-[#E5E7EB] rounded-xl p-3">
                    <div className="flex items-start gap-3">
                      <img src={product.imagePath} alt={product.name} className="h-20 w-20 rounded-md object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[#1F1F1F] truncate">{product.name}</p>
                        <p className="text-sm text-[#6B7280]">{product.city} - {product.location}</p>
                        <p className="text-sm text-[#C8A97E] font-semibold">AED {product.price}</p>
                        <p className="text-xs text-[#6B7280] mt-1">{product.productType}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => startEditing(product)} className="h-9 px-3 rounded-lg bg-[#F3EBDD] text-[#7A5E37] text-sm font-semibold">
                        تعديل
                      </button>
                      <button onClick={() => deleteProduct(product.id)} className="h-9 px-3 rounded-lg bg-[#FEE2E2] text-[#B91C1C] text-sm font-semibold">
                        حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

