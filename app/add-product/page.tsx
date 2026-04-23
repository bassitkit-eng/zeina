'use client'

import { ChangeEvent, useMemo, useRef, useState } from 'react'
import { AppHeader } from '@/components/shared/AppHeader'
import { useProducts } from '@/app/contexts/ProductsContext'
import { CATEGORIES, type CategoryId, type Product } from '@/lib/catalog'
import { getAreasByGovernorate, GOVERNORATE_OPTIONS } from '@/lib/egyptLocations'

type ProductFormState = {
  name: string
  category: CategoryId
  productType: string
  city: string
  location: string
  price: string
  description: string
  imagePaths: string[]
}

type ConfirmAction =
  | { type: 'delete-image'; imageIndex: number }
  | { type: 'delete-product'; productId: number }
  | null

const initialForm: ProductFormState = {
  name: '',
  category: 'kosha',
  productType: 'زفاف',
  city: '',
  location: '',
  price: '',
  description: '',
  imagePaths: [],
}

export default function AddProductPage() {
  const { customProducts, addProduct, updateProduct, deleteProduct } = useProducts()
  const [form, setForm] = useState<ProductFormState>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const actionLabel = useMemo(() => (editingId ? 'حفظ التعديلات' : 'إضافة المنتج'), [editingId])
  const areaOptions = useMemo(() => getAreasByGovernorate(form.city), [form.city])

  const confirmMessage = useMemo(() => {
    if (!confirmAction) return ''
    if (confirmAction.type === 'delete-image') {
      return 'هل أنت متأكد من حذف هذه الصورة؟ لا يمكن التراجع بعد الحذف.'
    }
    return 'هل أنت متأكد من حذف المنتج؟ سيتم حذف جميع بياناته.'
  }, [confirmAction])

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const currentCount = form.imagePaths.length
    const availableSlots = 4 - currentCount
    if (availableSlots <= 0) {
      setError('الحد الأقصى للصور هو 4 صور.')
      return
    }

    const selected = files.slice(0, availableSlots)
    const base64Images = await Promise.all(
      selected.map(
        (file) =>
          new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
            reader.readAsDataURL(file)
          })
      )
    )

    setForm((prev) => ({ ...prev, imagePaths: [...prev.imagePaths, ...base64Images].slice(0, 4) }))
    setError('')
    e.target.value = ''
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
      imagePaths: product.imagePaths?.length ? product.imagePaths : [product.imagePath],
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
    if (!form.name || !form.city || !form.location || !form.price || form.imagePaths.length === 0) {
      setError('من فضلك أكمل كل الحقول المطلوبة وارفع صورة واحدة على الأقل.')
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
      imagePaths: form.imagePaths,
    }

    if (editingId) {
      updateProduct(editingId, payload)
    } else {
      addProduct(payload)
    }

    resetForm()
  }

  const runConfirmAction = () => {
    if (!confirmAction) return

    if (confirmAction.type === 'delete-image') {
      setForm((prev) => ({
        ...prev,
        imagePaths: prev.imagePaths.filter((_, i) => i !== confirmAction.imageIndex),
      }))
    }

    if (confirmAction.type === 'delete-product') {
      deleteProduct(confirmAction.productId)
      if (editingId === confirmAction.productId) {
        resetForm()
      }
    }

    setConfirmAction(null)
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
                <select
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value, location: '' }))}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  <option value="">اختر المحافظة</option>
                  {GOVERNORATE_OPTIONS.map((governorate) => (
                    <option key={governorate} value={governorate}>
                      {governorate}
                    </option>
                  ))}
                </select>

                <select
                  value={form.location}
                  onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                  disabled={!form.city}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  <option value="">{form.city ? 'اختر المنطقة / المدينة' : 'اختر المحافظة أولًا'}</option>
                  {areaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                  {form.location && !areaOptions.includes(form.location) && <option value={form.location}>{form.location}</option>}
                </select>
              </div>

              <textarea
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="تفاصيل المنتج"
                rows={4}
                className="w-full rounded-lg border border-[#DCCAB2] bg-white p-3 text-[#1F1F1F]"
              />

              <div>
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">صور المنتج (حد أقصى 4 صور)</label>
                <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-11 px-4 rounded-lg bg-[#C8A97E] text-white font-bold hover:opacity-90 transition"
                >
                  اختيار الصور
                </button>
                <p className="text-xs text-[#6B7280] mt-2">يمكنك اختيار حتى 4 صور. الصورة الأولى ستكون الصورة الرئيسية.</p>
              </div>

              {form.imagePaths.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {form.imagePaths.map((image, index) => (
                    <div key={`${image.slice(0, 20)}-${index}`} className="relative h-32 rounded-lg overflow-hidden border border-[#E5E7EB]">
                      <img src={image} alt={`معاينة المنتج ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'delete-image', imageIndex: index })}
                        className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/70 text-white text-sm"
                      >
                        ×
                      </button>
                      {index === 0 && <span className="absolute bottom-2 right-2 text-xs bg-[#C8A97E] text-white px-2 py-1 rounded-full">رئيسية</span>}
                    </div>
                  ))}
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
                      <button
                        onClick={() => setConfirmAction({ type: 'delete-product', productId: product.id })}
                        className="h-9 px-3 rounded-lg bg-[#FEE2E2] text-[#B91C1C] text-sm font-semibold"
                      >
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

      {confirmAction && (
        <div className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center px-4" dir="rtl">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#1F1F1F] mb-3">تأكيد الإجراء</h3>
            <p className="text-[#4B5563] mb-6">{confirmMessage}</p>
            <div className="flex gap-3">
              <button onClick={runConfirmAction} className="flex-1 h-11 rounded-lg bg-[#DC2626] text-white font-bold hover:opacity-90 transition">
                تأكيد الحذف
              </button>
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 h-11 rounded-lg border border-[#9CA3AF] text-[#4B5563] font-bold hover:bg-[#F3F4F6] transition"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
