'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from '@/components/shared/AppHeader'
import { useProducts } from '@/app/contexts/ProductsContext'
import { CATEGORIES, type CategoryId, type Product, type ProductStatus } from '@/lib/catalog'
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
  status: ProductStatus
}

type ConfirmAction =
  | { type: 'delete-image'; imageIndex: number; target: 'create' | 'edit' }
  | { type: 'delete-product'; productId: number }
  | null

const initialForm: ProductFormState = {
  name: '',
  category: 'kosha',
  productType: 'عام',
  city: '',
  location: '',
  price: '',
  description: '',
  imagePaths: [],
  status: 'draft',
}

const STEPS = ['بيانات أساسية', 'التصنيف والموقع', 'الصور', 'المراجعة والنشر']

export default function AddProductPage() {
  const { customProducts, addProduct, updateProduct, deleteProduct } = useProducts()

  const [form, setForm] = useState<ProductFormState>(initialForm)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [activeTab, setActiveTab] = useState<'add' | 'mine'>('add')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const editFileInputRef = useRef<HTMLInputElement | null>(null)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<ProductFormState>(initialForm)
  const [editError, setEditError] = useState('')

  const areaOptions = useMemo(() => getAreasByGovernorate(form.city), [form.city])
  const editAreaOptions = useMemo(() => getAreasByGovernorate(editForm.city), [editForm.city])

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      if (!form.name.trim()) {
        setError('أدخل اسم المنتج أولًا.')
        return false
      }
    }

    if (stepIndex === 1) {
      if (!form.category || !form.city || !form.location || !form.price) {
        setError('اختر التصنيف والمحافظة والمنطقة وأدخل السعر.')
        return false
      }
      const parsedPrice = Number(form.price)
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        setError('السعر يجب أن يكون رقمًا صحيحًا أكبر من صفر.')
        return false
      }
    }

    if (stepIndex === 2) {
      if (form.imagePaths.length === 0) {
        setError('أضف صورة واحدة على الأقل.')
        return false
      }
    }

    setError('')
    return true
  }

  const nextStep = () => {
    if (!validateStep(step)) return
    setStep((prev) => Math.min(prev + 1, STEPS.length - 1))
  }

  const previousStep = () => {
    setError('')
    setStep((prev) => Math.max(prev - 1, 0))
  }

  const onFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const availableSlots = 4 - form.imagePaths.length
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
    setEditingProductId(product.id)
    setEditForm({
      name: product.name,
      category: product.category,
      productType: product.productType,
      city: product.city,
      location: product.location,
      price: String(product.price),
      description: product.description || '',
      imagePaths: product.imagePaths?.length ? product.imagePaths : [product.imagePath],
      status: product.status || 'draft',
    })
    setEditError('')
  }

  const resetForm = () => {
    setForm(initialForm)
    setError('')
    setStep(0)
  }

  const submitWithStatus = (status: ProductStatus) => {
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return

    const payload = {
      name: form.name.trim(),
      category: form.category,
      productType: form.productType.trim() || 'عام',
      city: form.city,
      location: form.location,
      price: Number(form.price),
      description: form.description.trim(),
      imagePaths: form.imagePaths,
      status,
    }

    addProduct(payload)
    resetForm()
    setActiveTab('mine')
  }

  const onEditFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    const availableSlots = 4 - editForm.imagePaths.length
    if (availableSlots <= 0) {
      setEditError('الحد الأقصى للصور هو 4 صور.')
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

    setEditForm((prev) => ({ ...prev, imagePaths: [...prev.imagePaths, ...base64Images].slice(0, 4) }))
    setEditError('')
    e.target.value = ''
  }

  const closeEditModal = () => {
    setEditingProductId(null)
    setEditForm(initialForm)
    setEditError('')
  }

  const saveEditModal = () => {
    if (!editingProductId) return
    if (!editForm.name.trim()) {
      setEditError('أدخل اسم المنتج أولًا.')
      return
    }
    if (!editForm.category || !editForm.city || !editForm.location || !editForm.price) {
      setEditError('اختر التصنيف والمحافظة والمنطقة وأدخل السعر.')
      return
    }
    const parsedPrice = Number(editForm.price)
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setEditError('السعر يجب أن يكون رقمًا صحيحًا أكبر من صفر.')
      return
    }
    if (editForm.imagePaths.length === 0) {
      setEditError('أضف صورة واحدة على الأقل.')
      return
    }

    updateProduct(editingProductId, {
      name: editForm.name.trim(),
      category: editForm.category,
      productType: editForm.productType.trim() || 'عام',
      city: editForm.city,
      location: editForm.location,
      price: parsedPrice,
      description: editForm.description.trim(),
      imagePaths: editForm.imagePaths,
      status: editForm.status,
    })

    closeEditModal()
  }

  const confirmMessage = useMemo(() => {
    if (!confirmAction) return ''
    if (confirmAction.type === 'delete-image') return 'هل أنت متأكد من حذف هذه الصورة؟ لا يمكن التراجع بعد الحذف.'
    return 'هل أنت متأكد من حذف المنتج؟ سيتم حذف جميع بياناته.'
  }, [confirmAction])

  const runConfirmAction = () => {
    if (!confirmAction) return

    if (confirmAction.type === 'delete-image') {
      if (confirmAction.target === 'create') {
        setForm((prev) => ({ ...prev, imagePaths: prev.imagePaths.filter((_, i) => i !== confirmAction.imageIndex) }))
      } else {
        setEditForm((prev) => ({ ...prev, imagePaths: prev.imagePaths.filter((_, i) => i !== confirmAction.imageIndex) }))
      }
    }

    if (confirmAction.type === 'delete-product') {
      deleteProduct(confirmAction.productId)
      if (editingProductId === confirmAction.productId) closeEditModal()
    }

    setConfirmAction(null)
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />

      <section className="zeina-halo-section px-4 py-10" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold text-[#1F1F1F]">إضافة منتج</h1>
          <p className="text-[#6B6B6B] mt-2">أضف منتجك باحترافية من خلال خطوات واضحة.</p>
        </div>
      </section>

      <section className="px-4 py-8" dir="rtl">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex items-center gap-2 rounded-xl bg-white border border-[#E5E7EB] p-2 w-fit">
            <button
              onClick={() => setActiveTab('add')}
              className={`h-10 px-5 rounded-lg font-bold transition ${activeTab === 'add' ? 'bg-[#7B57C8] text-white' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}
            >
              إضافة منتج
            </button>
            <button
              onClick={() => setActiveTab('mine')}
              className={`h-10 px-5 rounded-lg font-bold transition ${activeTab === 'mine' ? 'bg-[#7B57C8] text-white' : 'text-[#4B5563] hover:bg-[#F3F4F6]'}`}
            >
              منتجاتي
            </button>
          </div>

          {activeTab === 'add' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">بيانات المنتج</h2>

              <div className="mb-6">
                <div className="h-2 w-full rounded-full bg-[#E5E7EB] overflow-hidden">
                  <div className="h-full bg-[#7B57C8] transition-all" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
                </div>
                <div className="mt-2 text-sm text-[#6B7280]">الخطوة {step + 1} من {STEPS.length}: {STEPS[step]}</div>
              </div>

              {step === 0 && (
                <div className="space-y-4">
                  <input
                    value={form.name}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="اسم المنتج"
                    className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                  />
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="تفاصيل المنتج"
                    rows={5}
                    className="w-full rounded-lg border border-[#DCCAB2] bg-white p-3 text-[#1F1F1F]"
                  />
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <select
                    value={form.category}
                    onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value as CategoryId }))}
                    className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                  >
                    {CATEGORIES.map((category) => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <select
                      value={form.city}
                      onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value, location: '' }))}
                      className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                    >
                      <option value="">اختر المحافظة</option>
                      {GOVERNORATE_OPTIONS.map((governorate) => (
                        <option key={governorate} value={governorate}>{governorate}</option>
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
                        <option key={area} value={area}>{area}</option>
                      ))}
                      {form.location && !areaOptions.includes(form.location) && <option value={form.location}>{form.location}</option>}
                    </select>
                  </div>

                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                    placeholder="السعر"
                    className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                  />
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">صور المنتج (حد أقصى 4 صور)</label>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="h-11 px-4 rounded-lg bg-[#7B57C8] text-white font-bold hover:opacity-90 transition">
                      اختيار الصور
                    </button>
                    <p className="text-xs text-[#6B7280] mt-2">الصورة الأولى ستكون الصورة الرئيسية.</p>
                  </div>

                  {form.imagePaths.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                          {form.imagePaths.map((image, index) => (
                        <div key={`${image.slice(0, 20)}-${index}`} className="relative h-36 rounded-lg overflow-hidden border border-[#E5E7EB]">
                          <img src={image} alt={`معاينة ${index + 1}`} className="h-full w-full object-cover" />
                          <button type="button" onClick={() => setConfirmAction({ type: 'delete-image', imageIndex: index, target: 'create' })} className="absolute top-2 left-2 h-7 w-7 rounded-full bg-black/70 text-white text-sm">×</button>
                          {index === 0 && <span className="absolute bottom-2 right-2 text-xs bg-[#C8A97E] text-white px-2 py-1 rounded-full">رئيسية</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 text-[#374151]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-semibold">الاسم:</span> {form.name || '-'}</p>
                    <p><span className="font-semibold">التصنيف:</span> {CATEGORIES.find((c) => c.id === form.category)?.name}</p>
                    <p><span className="font-semibold">النوع:</span> {form.productType === 'عام' ? '-' : form.productType}</p>
                    <p><span className="font-semibold">السعر:</span> {form.price ? `EGP ${form.price}` : '-'}</p>
                    <p><span className="font-semibold">المحافظة:</span> {form.city || '-'}</p>
                    <p><span className="font-semibold">المنطقة:</span> {form.location || '-'}</p>
                  </div>
                  <p className="text-sm"><span className="font-semibold">الوصف:</span> {form.description || '-'}</p>
                  <p className="text-sm"><span className="font-semibold">عدد الصور:</span> {form.imagePaths.length}</p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button onClick={() => submitWithStatus('draft')} className="h-11 px-5 rounded-lg border border-[#7B57C8] text-[#7B57C8] font-bold">حفظ كمسودة</button>
                    <button onClick={() => submitWithStatus('published')} className="h-11 px-5 rounded-lg bg-[#7B57C8] text-white font-bold hover:opacity-90">نشر المنتج</button>
                  </div>
                </div>
              )}

              {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

              <div className="mt-6 flex gap-3">
                {step > 0 && <button onClick={previousStep} className="h-11 px-5 rounded-lg border border-[#9CA3AF] text-[#4B5563] font-bold">السابق</button>}
                {step < STEPS.length - 1 && <button onClick={nextStep} className="h-11 px-5 rounded-lg bg-[#7B57C8] text-white font-bold">التالي</button>}
                <button onClick={resetForm} className="h-11 px-5 rounded-lg border border-[#D1D5DB] text-[#6B7280] font-bold">تفريغ</button>
              </div>
            </div>
          )}

          {activeTab === 'mine' && (
            <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
              <h2 className="text-2xl font-bold text-[#1F1F1F] mb-4">منتجاتي</h2>
              {customProducts.length === 0 ? (
                <p className="text-[#6B6B6B]">لا توجد منتجات مضافة حتى الآن.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {customProducts.map((product) => (
                    <article key={product.id} className="border border-[#E5E7EB] rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                      <div className="relative h-56 bg-[#F3F4F6]">
                        <img src={product.imagePath} alt={product.name} className="h-full w-full object-cover" />
                        <span className="absolute top-3 right-3 text-xs bg-black/65 text-white px-2.5 py-1 rounded-full">
                          {product.status === 'published' ? 'منشور' : product.status === 'hidden' ? 'مخفي' : product.status === 'soldout' ? 'نفد' : 'مسودة'}
                        </span>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <p className="font-bold text-[#1F1F1F] text-lg leading-snug line-clamp-2">{product.name}</p>
                          <span className="text-xs bg-[#F3EBDD] text-[#7A5E37] px-2 py-1 rounded-full whitespace-nowrap">
                            {CATEGORIES.find((c) => c.id === product.category)?.name}
                          </span>
                        </div>

                        <p className="text-sm text-[#6B7280] mt-2">{product.city} - {product.location}</p>
                        <p className="text-lg text-[#C8A97E] font-bold mt-1">EGP {product.price}</p>
                        {product.productType !== 'عام' && <p className="text-xs text-[#6B7280] mt-1">{product.productType}</p>}

                        <div className="mt-4 grid grid-cols-2 gap-2">
                          <button onClick={() => startEditing(product)} className="h-10 rounded-lg bg-[#F3EBDD] text-[#7A5E37] text-sm font-semibold">
                            تعديل
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'delete-product', productId: product.id })}
                            className="h-10 rounded-lg bg-[#FEE2E2] text-[#B91C1C] text-sm font-semibold"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {confirmAction && (
        <div className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center px-4" dir="rtl">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-[#1F1F1F] mb-3">تأكيد الإجراء</h3>
            <p className="text-[#4B5563] mb-6">{confirmMessage}</p>
            <div className="flex gap-3">
              <button onClick={runConfirmAction} className="flex-1 h-11 rounded-lg bg-[#DC2626] text-white font-bold hover:opacity-90 transition">تأكيد الحذف</button>
              <button onClick={() => setConfirmAction(null)} className="flex-1 h-11 rounded-lg border border-[#9CA3AF] text-[#4B5563] font-bold hover:bg-[#F3F4F6] transition">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {editingProductId && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center px-4" dir="rtl">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-[#1F1F1F] mb-4">تعديل المنتج</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">اسم المنتج</label>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">التصنيف</label>
                <select
                  value={editForm.category}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, category: e.target.value as CategoryId }))}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  {CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">الحالة</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value as ProductStatus }))}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  <option value="draft">مسودة</option>
                  <option value="published">منشور</option>
                  <option value="hidden">مخفي</option>
                  <option value="soldout">نفد</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">المحافظة</label>
                <select
                  value={editForm.city}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, city: e.target.value, location: '' }))}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  <option value="">اختر المحافظة</option>
                  {GOVERNORATE_OPTIONS.map((governorate) => (
                    <option key={governorate} value={governorate}>
                      {governorate}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">المنطقة / المدينة</label>
                <select
                  value={editForm.location}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, location: e.target.value }))}
                  disabled={!editForm.city}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  <option value="">{editForm.city ? 'اختر المنطقة / المدينة' : 'اختر المحافظة أولًا'}</option>
                  {editAreaOptions.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                  {editForm.location && !editAreaOptions.includes(editForm.location) && <option value={editForm.location}>{editForm.location}</option>}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">السعر</label>
                <input
                  type="number"
                  value={editForm.price}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, price: e.target.value }))}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">نوع المنتج (اختياري)</label>
                <input
                  value={editForm.productType === 'عام' ? '' : editForm.productType}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, productType: e.target.value }))}
                  placeholder="مثال: زفاف / خطوبة"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">وصف المنتج</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-lg border border-[#DCCAB2] bg-white p-3 text-[#1F1F1F]"
                />
              </div>
            </div>

            <div className="mt-5">
              <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">صور المنتج (حد أقصى 4 صور)</label>
              <input ref={editFileInputRef} type="file" accept="image/*" multiple onChange={onEditFileChange} className="hidden" />
              <button type="button" onClick={() => editFileInputRef.current?.click()} className="h-10 px-4 rounded-lg bg-[#7B57C8] text-white font-bold hover:opacity-90 transition">
                إضافة صور
              </button>

              {editForm.imagePaths.length > 0 && (
                <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {editForm.imagePaths.map((image, index) => (
                    <div key={`${image.slice(0, 20)}-${index}`} className="relative h-28 rounded-lg overflow-hidden border border-[#E5E7EB]">
                      <img src={image} alt={`صورة ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setConfirmAction({ type: 'delete-image', imageIndex: index, target: 'edit' })}
                        className="absolute top-2 left-2 h-6 w-6 rounded-full bg-black/70 text-white text-sm"
                      >
                        ×
                      </button>
                      {index === 0 && <span className="absolute bottom-1 right-1 text-[10px] bg-[#C8A97E] text-white px-1.5 py-0.5 rounded-full">رئيسية</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {editError && <p className="text-red-600 text-sm mt-4">{editError}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={saveEditModal} className="h-11 px-5 rounded-lg bg-[#7B57C8] text-white font-bold hover:opacity-90 transition">
                حفظ التعديلات
              </button>
              <button onClick={closeEditModal} className="h-11 px-5 rounded-lg border border-[#9CA3AF] text-[#4B5563] font-bold hover:bg-[#F3F4F6] transition">
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
