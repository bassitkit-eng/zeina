'use client'

import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { AppHeader } from '@/components/shared/AppHeader'
import { useProducts } from '@/app/contexts/ProductsContext'
import { useAuth } from '@/app/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { CATEGORIES, type CategoryId, type Product, type ProductId, type ProductStatus } from '@/lib/catalog'
import { GOVERNORATE_OPTIONS } from '@/lib/egyptLocations'
import { buildProductImagesPayload, deleteProductImageByStoragePath, uploadProductImage, type UploadedImageMeta } from '@/lib/services/productImageUpload'
import { fetchMarketOptions, type MarketOptions } from '@/lib/services/marketOptions'
import { supabaseClient } from '@/lib/supabase/client'

type ProductFormState = {
  name: string
  category: CategoryId
  productType: string
  city: string
  location: string
  price: string
  phone: string
  whatsapp: string
  instagram: string
  facebook: string
  tiktok: string
  description: string
  imagePaths: string[]
  imageStoragePaths: string[]
  status: ProductStatus
}

type ConfirmAction =
  | { type: 'delete-image'; imageIndex: number; target: 'create' | 'edit' }
  | { type: 'delete-product'; productId: ProductId }
  | null

type VendorPrefill = Pick<ProductFormState, 'city' | 'location' | 'phone' | 'whatsapp' | 'instagram' | 'facebook' | 'tiktok'>

const initialForm: ProductFormState = {
  name: '',
  category: 'kosha',
  productType: 'عام',
  city: '',
  location: '',
  price: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  description: '',
  imagePaths: [],
  imageStoragePaths: [],
  status: 'draft',
}

const STEPS = ['بيانات أساسية', 'التصنيف والموقع', 'معلومات التواصل', 'الصور', 'المراجعة والنشر']
const PUBLISH_TIMEOUT_MS = 30000
const DEFAULT_PRODUCT_NAME = 'منتج بدون اسم'
const emptyPrefill: VendorPrefill = {
  city: '',
  location: '',
  phone: '',
  whatsapp: '',
  instagram: '',
  facebook: '',
  tiktok: '',
}

function normalizeArabicDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/٬/g, '')
    .replace(/،/g, '.')
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    promise
      .then((value) => {
        clearTimeout(timer)
        resolve(value)
      })
      .catch((error) => {
        clearTimeout(timer)
        reject(error)
      })
  })
}

function hasAtLeastOneContact(formState: Pick<ProductFormState, 'phone' | 'whatsapp' | 'instagram' | 'facebook' | 'tiktok'>) {
  return [formState.phone, formState.whatsapp, formState.instagram, formState.facebook, formState.tiktok].some((value) => value.trim().length > 0)
}

export default function AddProductPage() {
  const router = useRouter()
  const { isLoading: isAuthLoading, user } = useAuth()
  const { customProducts, addProduct, updateProduct, deleteProduct } = useProducts()

  const [form, setForm] = useState<ProductFormState>(initialForm)
  const [error, setError] = useState('')
  const [step, setStep] = useState(0)
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null)
  const [activeTab, setActiveTab] = useState<'add' | 'mine'>('add')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const editFileInputRef = useRef<HTMLInputElement | null>(null)
  const [editingProductId, setEditingProductId] = useState<ProductId | null>(null)
  const [editForm, setEditForm] = useState<ProductFormState>(initialForm)
  const [editError, setEditError] = useState('')
  const [draftUploadProductId, setDraftUploadProductId] = useState(() => crypto.randomUUID())
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [marketOptions, setMarketOptions] = useState<MarketOptions | null>(null)
  const [vendorPrefill, setVendorPrefill] = useState<VendorPrefill>(emptyPrefill)

  const categoryOptions = marketOptions?.categories || CATEGORIES
  const governorateOptions = marketOptions?.governorates || GOVERNORATE_OPTIONS
  const areaOptions = useMemo(() => (form.city ? marketOptions?.citiesByGovernorate[form.city] || [] : []), [form.city, marketOptions])
  const editAreaOptions = useMemo(() => (editForm.city ? marketOptions?.citiesByGovernorate[editForm.city] || [] : []), [editForm.city, marketOptions])
  const formSubcategoryOptions = useMemo(() => marketOptions?.subcategoriesByCategory[form.category] || [], [form.category, marketOptions])
  const editSubcategoryOptions = useMemo(() => marketOptions?.subcategoriesByCategory[editForm.category] || [], [editForm.category, marketOptions])
  const confirmMessage = useMemo(() => {
    if (!confirmAction) return ''
    if (confirmAction.type === 'delete-image') return 'هل أنت متأكد من حذف هذه الصورة؟ لا يمكن التراجع بعد الحذف.'
    return 'هل أنت متأكد من حذف المنتج؟ سيتم حذف جميع بياناته.'
  }, [confirmAction])

  useEffect(() => {
    if (isAuthLoading) return
    if (!user) {
      router.replace('/auth')
    }
  }, [isAuthLoading, user, router])

  useEffect(() => {
    let isMounted = true
    void fetchMarketOptions().then((options) => {
      if (!isMounted) return
      setMarketOptions(options)
    })
    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (formSubcategoryOptions.length === 0) return
    if (form.productType !== 'عام') return
    setForm((prev) => ({ ...prev, productType: formSubcategoryOptions[0] }))
  }, [formSubcategoryOptions, form.productType])

  useEffect(() => {
    if (!editingProductId) return
    if (editSubcategoryOptions.length === 0) return
    if (editForm.productType !== 'عام') return
    setEditForm((prev) => ({ ...prev, productType: editSubcategoryOptions[0] }))
  }, [editingProductId, editSubcategoryOptions, editForm.productType])

  useEffect(() => {
    if (!user?.id) return

    let isMounted = true
    void (async () => {
      const { data: vendor, error } = await supabaseClient
        .from('vendor_profiles')
        .select('phone,whatsapp,instagram,facebook,tiktok,address_text,governorate_id,city_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!isMounted || error || !vendor) return

      let governorateName = ''
      if (vendor.governorate_id) {
        const { data } = await supabaseClient
          .from('governorates')
          .select('name_ar,name_en')
          .eq('id', vendor.governorate_id)
          .maybeSingle()
        governorateName = (data?.name_ar || data?.name_en || '').trim()
      }

      let cityName = ''
      if (vendor.city_id) {
        const { data } = await supabaseClient
          .from('cities')
          .select('name_ar,name_en')
          .eq('id', vendor.city_id)
          .maybeSingle()
        cityName = (data?.name_ar || data?.name_en || '').trim()
      }

      const defaults: VendorPrefill = {
        city: governorateName,
        location: cityName || (vendor.address_text || '').trim(),
        phone: (vendor.phone || '').trim(),
        whatsapp: (vendor.whatsapp || '').trim(),
        instagram: (vendor.instagram || '').trim(),
        facebook: (vendor.facebook || '').trim(),
        tiktok: (vendor.tiktok || '').trim(),
      }

      setVendorPrefill(defaults)
      setForm((prev) => ({
        ...prev,
        city: prev.city || defaults.city,
        location: prev.location || defaults.location,
        phone: prev.phone || defaults.phone,
        whatsapp: prev.whatsapp || defaults.whatsapp,
        instagram: prev.instagram || defaults.instagram,
        facebook: prev.facebook || defaults.facebook,
        tiktok: prev.tiktok || defaults.tiktok,
      }))
    })()

    return () => {
      isMounted = false
    }
  }, [user?.id])

  if (isAuthLoading) {
    return (
      <main className="min-h-screen bg-[#FAF9F7]">
        <AppHeader />
        <section className="px-4 py-16" dir="rtl">
          <div className="max-w-4xl mx-auto text-center text-[#6B7280]">جارٍ التحقق من تسجيل الدخول...</div>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#FAF9F7]">
        <AppHeader />
        <section className="px-4 py-16" dir="rtl">
          <div className="max-w-4xl mx-auto text-center text-[#B91C1C]">برجاء تسجيل الدخول أولًا للوصول إلى صفحة إضافة المنتجات.</div>
        </section>
      </main>
    )
  }

  const currentUserId = user.id

  const validateStep = (stepIndex: number) => {
    if (stepIndex === 0) {
      if (!form.description.trim()) {
        setError('أدخل وصف المنتج أولًا.')
        return false
      }
    }

    if (stepIndex === 1) {
      const cityValue = form.city.trim()
      const locationValue = form.location.trim() || cityValue
      const normalizedPrice = normalizeArabicDigits(form.price.trim())

      if (!form.category || !cityValue || !normalizedPrice) {
        setError('اختر التصنيف والمحافظة وأدخل السعر.')
        return false
      }

      // If location was left empty, default it to the selected governorate.
      if (!form.location.trim()) {
        setForm((prev) => ({ ...prev, location: cityValue }))
      }

      const parsedPrice = Number(normalizedPrice)
      if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
        setError('السعر يجب أن يكون رقمًا صحيحًا أكبر من صفر.')
        return false
      }

      if (normalizedPrice !== form.price) {
        setForm((prev) => ({ ...prev, price: normalizedPrice }))
      }
    }

    if (stepIndex === 3) {
      if (form.imagePaths.length === 0) {
        setError('أضف صورة واحدة على الأقل.')
        return false
      }
    }

    if (stepIndex === 2) {
      if (!hasAtLeastOneContact(form)) {
        setError('أدخل وسيلة تواصل واحدة على الأقل (هاتف أو واتساب أو إنستجرام أو فيسبوك أو تيك توك).')
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
    if (!currentUserId) {
      setError('برجاء تسجيل الدخول أولًا قبل رفع الصور.')
      e.target.value = ''
      return
    }

    const availableSlots = 4 - form.imagePaths.length
    if (availableSlots <= 0) {
      setError('الحد الأقصى للصور هو 4 صور.')
      return
    }

    try {
      setIsUploading(true)
      const selected = files.slice(0, availableSlots)
      const uploaded = await Promise.all(
        selected.map((file) => uploadProductImage({ file, userId: currentUserId, productId: draftUploadProductId }))
      )

      setForm((prev) => ({
        ...prev,
        imagePaths: [...prev.imagePaths, ...uploaded.map((item) => item.imageUrl)].slice(0, 4),
        imageStoragePaths: [...prev.imageStoragePaths, ...uploaded.map((item) => item.storagePath)].slice(0, 4),
      }))
      setError('')
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'تعذر رفع الصور الآن.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
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
      phone: product.contactInfo?.phone || '',
      whatsapp: product.contactInfo?.whatsapp || '',
      instagram: product.contactInfo?.instagram || '',
      facebook: product.contactInfo?.facebook || '',
      tiktok: product.contactInfo?.tiktok || '',
      description: product.description || '',
      imagePaths: product.imagePaths?.length ? product.imagePaths : [product.imagePath],
      imageStoragePaths: product.imageStoragePaths || [],
      status: product.status || 'draft',
    })
    setEditError('')
  }

  const resetForm = (prefillOverride?: VendorPrefill) => {
    const nextPrefill = prefillOverride || vendorPrefill
    setForm({
      ...initialForm,
      ...nextPrefill,
    })
    setDraftUploadProductId(crypto.randomUUID())
    setError('')
    setStep(0)
  }

  const submitWithStatus = async (status: ProductStatus) => {
    if (isSubmitting) return
    if (!validateStep(0) || !validateStep(1) || !validateStep(2) || !validateStep(3)) return

    const normalizedPrice = normalizeArabicDigits(form.price.trim())
    const parsedPrice = Number(normalizedPrice)
    const resolvedLocation = form.location.trim() || form.city.trim()
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      setError('السعر يجب أن يكون رقمًا صحيحًا أكبر من صفر.')
      return
    }

    setIsSubmitting(true)
    setError('')

    const payload = {
      name: form.name.trim() || DEFAULT_PRODUCT_NAME,
      category: form.category,
      productType: (form.productType.trim() === 'عام' && formSubcategoryOptions.length > 0 ? formSubcategoryOptions[0] : form.productType.trim()) || 'عام',
      city: form.city,
      location: resolvedLocation,
      price: parsedPrice,
      contactInfo: {
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        tiktok: form.tiktok.trim(),
      },
      description: form.description.trim(),
      imagePaths: form.imagePaths,
      imageStoragePaths: form.imageStoragePaths,
      status,
    }

    // جاهز لاحقًا لحفظه مباشرة في جدول product_images داخل Supabase.
    const uploadedImagesForInsert: UploadedImageMeta[] = form.imageStoragePaths
      .map((storagePath, index) => ({ storagePath, imageUrl: form.imagePaths[index] || '' }))
      .filter((item) => Boolean(item.imageUrl))
    void buildProductImagesPayload(draftUploadProductId, uploadedImagesForInsert)

    try {
      await withTimeout(
        addProduct(payload),
        PUBLISH_TIMEOUT_MS,
        'تأخر الاتصال أثناء النشر. تحقق من الإنترنت ثم أعد المحاولة، أو راجع "منتجاتي" فقد يكون المنتج نُشر بالفعل.'
      )
      const nextPrefill: VendorPrefill = {
        city: form.city.trim(),
        location: resolvedLocation,
        phone: form.phone.trim(),
        whatsapp: form.whatsapp.trim(),
        instagram: form.instagram.trim(),
        facebook: form.facebook.trim(),
        tiktok: form.tiktok.trim(),
      }
      setVendorPrefill(nextPrefill)
      resetForm(nextPrefill)
      setActiveTab('mine')
    } catch (submitError) {
      console.error('submitWithStatus failed', submitError)
      setError(submitError instanceof Error ? submitError.message : 'تعذر حفظ المنتج الآن.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const onEditFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    if (!currentUserId || !editingProductId) {
      setEditError('برجاء تسجيل الدخول أولًا قبل رفع الصور.')
      e.target.value = ''
      return
    }

    const availableSlots = 4 - editForm.imagePaths.length
    if (availableSlots <= 0) {
      setEditError('الحد الأقصى للصور هو 4 صور.')
      return
    }

    try {
      setIsUploading(true)
      const selected = files.slice(0, availableSlots)
      const uploaded = await Promise.all(
        selected.map((file) => uploadProductImage({ file, userId: currentUserId, productId: String(editingProductId) }))
      )

      setEditForm((prev) => ({
        ...prev,
        imagePaths: [...prev.imagePaths, ...uploaded.map((item) => item.imageUrl)].slice(0, 4),
        imageStoragePaths: [...prev.imageStoragePaths, ...uploaded.map((item) => item.storagePath)].slice(0, 4),
      }))
      setEditError('')
    } catch (uploadError) {
      setEditError(uploadError instanceof Error ? uploadError.message : 'تعذر رفع الصور الآن.')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const closeEditModal = () => {
    setEditingProductId(null)
    setEditForm(initialForm)
    setEditError('')
  }

  const saveEditModal = async () => {
    if (!editingProductId) return
    if (!editForm.description.trim()) {
      setEditError('أدخل وصف المنتج أولًا.')
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
    if (!hasAtLeastOneContact(editForm)) {
      setEditError('أدخل وسيلة تواصل واحدة على الأقل (هاتف أو واتساب أو إنستجرام أو فيسبوك أو تيك توك).')
      return
    }

    try {
      await updateProduct(editingProductId, {
        name: editForm.name.trim() || DEFAULT_PRODUCT_NAME,
        category: editForm.category,
        productType:
          (editForm.productType.trim() === 'عام' && editSubcategoryOptions.length > 0 ? editSubcategoryOptions[0] : editForm.productType.trim()) || 'عام',
        city: editForm.city,
        location: editForm.location,
        price: parsedPrice,
        contactInfo: {
          phone: editForm.phone.trim(),
          whatsapp: editForm.whatsapp.trim(),
          instagram: editForm.instagram.trim(),
          facebook: editForm.facebook.trim(),
          tiktok: editForm.tiktok.trim(),
        },
        description: editForm.description.trim(),
        imagePaths: editForm.imagePaths,
        imageStoragePaths: editForm.imageStoragePaths,
        status: editForm.status,
      })

      closeEditModal()
    } catch (updateError) {
      setEditError(updateError instanceof Error ? updateError.message : 'تعذر حفظ التعديلات الآن.')
    }
  }

  const runConfirmAction = async () => {
    if (!confirmAction) return

    if (confirmAction.type === 'delete-image') {
      const storagePathToDelete =
        confirmAction.target === 'create'
          ? form.imageStoragePaths[confirmAction.imageIndex]
          : editForm.imageStoragePaths[confirmAction.imageIndex]

      if (confirmAction.target === 'create') {
        setForm((prev) => ({
          ...prev,
          imagePaths: prev.imagePaths.filter((_, i) => i !== confirmAction.imageIndex),
          imageStoragePaths: prev.imageStoragePaths.filter((_, i) => i !== confirmAction.imageIndex),
        }))
      } else {
        setEditForm((prev) => ({
          ...prev,
          imagePaths: prev.imagePaths.filter((_, i) => i !== confirmAction.imageIndex),
          imageStoragePaths: prev.imageStoragePaths.filter((_, i) => i !== confirmAction.imageIndex),
        }))
      }

      if (storagePathToDelete) {
        void deleteProductImageByStoragePath(storagePathToDelete).catch((error) => {
          console.warn('Failed to delete image from R2 after removing from form:', error)
        })
      }
    }

    if (confirmAction.type === 'delete-product') {
      try {
        await deleteProduct(confirmAction.productId)
        if (String(editingProductId) === String(confirmAction.productId)) closeEditModal()
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'تعذر حذف المنتج الآن.')
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
                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-black">
                      اسم المنتج <span className="text-[12px] font-medium text-[#9CA3AF]">(اختياري)</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="مثال: كوشة ملكية فاخرة"
                      className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                    />
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-black">وصف المنتج</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                      placeholder="مثال: تصميم أنيق مناسب لحفلات الزفاف والخطوبة."
                      rows={5}
                      className="w-full rounded-lg border border-[#DCCAB2] bg-white p-3 text-[#1F1F1F]"
                    />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-black">التصنيف الرئيسي</label>
                    <select
                      value={form.category}
                      onChange={(e) =>
                        setForm((prev) => {
                          const nextCategory = e.target.value as CategoryId
                          const nextTypeOptions = marketOptions?.subcategoriesByCategory[nextCategory] || []
                          const keepCurrentType = prev.productType !== 'عام' && nextTypeOptions.includes(prev.productType)
                          return {
                            ...prev,
                            category: nextCategory,
                            productType: keepCurrentType ? prev.productType : nextTypeOptions[0] || 'عام',
                          }
                        })
                      }
                      className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                    >
                      {categoryOptions.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-black">التصنيف الفرعي</label>
                    <select
                      value={form.productType}
                      onChange={(e) => setForm((prev) => ({ ...prev, productType: e.target.value }))}
                      className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                    >
                      <option value="عام">عام</option>
                      {formSubcategoryOptions.map((subcategory) => (
                        <option key={subcategory} value={subcategory}>
                          {subcategory}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block mb-2 text-sm font-extrabold text-black">المحافظة</label>
                      <select
                        value={form.city}
                        onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value, location: '' }))}
                        className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                      >
                        <option value="">اختر المحافظة</option>
                        {governorateOptions.map((governorate) => (
                          <option key={governorate} value={governorate}>
                            {governorate}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-extrabold text-black">المنطقة / المدينة</label>
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
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-black">السعر</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      placeholder="مثال: 2500"
                      className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    <div>
                      <label className="block mb-2 text-sm font-extrabold text-black">رقم الهاتف</label>
                      <input
                        value={form.phone}
                        onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="مثال: 01012345678"
                        className="h-11 w-full sm:w-[240px] rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-extrabold text-black">رقم الواتساب</label>
                      <input
                        value={form.whatsapp}
                        onChange={(e) => setForm((prev) => ({ ...prev, whatsapp: e.target.value }))}
                        placeholder="مثال: +201012345678"
                        className="h-11 w-full sm:w-[240px] rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <div>
                      <label className="block mb-2 text-sm font-extrabold text-black">إنستجرام</label>
                      <input
                        value={form.instagram}
                        onChange={(e) => setForm((prev) => ({ ...prev, instagram: e.target.value }))}
                        placeholder="مثال: @zeina_store"
                        className="h-11 w-full sm:w-[320px] rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-sm font-extrabold text-black">فيسبوك</label>
                      <input
                        value={form.facebook}
                        onChange={(e) => setForm((prev) => ({ ...prev, facebook: e.target.value }))}
                        placeholder="مثال: facebook.com/zeina.store"
                        className="h-11 w-full sm:w-[320px] rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2 text-sm font-extrabold text-black">تيك توك</label>
                    <input
                      value={form.tiktok}
                      onChange={(e) => setForm((prev) => ({ ...prev, tiktok: e.target.value }))}
                      placeholder="مثال: @zeina.events"
                      className="h-11 w-full sm:w-[320px] rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">صور المنتج (حد أقصى 4 صور)</label>
                    <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={onFileChange} className="hidden" />
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="h-11 px-4 rounded-lg bg-[#7B57C8] text-white font-bold hover:opacity-90 transition disabled:opacity-60"
                    >
                      {isUploading ? 'جارٍ رفع الصور...' : 'اختيار الصور'}
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

              {step === 4 && (
                <div className="space-y-4 text-[#374151]">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <p><span className="font-semibold">الاسم:</span> {form.name || '-'}</p>
                    <p><span className="font-semibold">التصنيف:</span> {categoryOptions.find((c) => c.id === form.category)?.name}</p>
                    <p><span className="font-semibold">النوع:</span> {form.productType === 'عام' ? '-' : form.productType}</p>
                    <p><span className="font-semibold">السعر:</span> {form.price ? `EGP ${form.price}` : '-'}</p>
                    <p><span className="font-semibold">المحافظة:</span> {form.city || '-'}</p>
                    <p><span className="font-semibold">المنطقة:</span> {form.location || '-'}</p>
                    <p><span className="font-semibold">الهاتف:</span> {form.phone || '-'}</p>
                    <p><span className="font-semibold">الواتساب:</span> {form.whatsapp || '-'}</p>
                    <p><span className="font-semibold">إنستجرام:</span> {form.instagram || '-'}</p>
                    <p><span className="font-semibold">فيسبوك:</span> {form.facebook || '-'}</p>
                    <p><span className="font-semibold">تيك توك:</span> {form.tiktok || '-'}</p>
                  </div>
                  <p className="text-sm"><span className="font-semibold">الوصف:</span> {form.description || '-'}</p>
                  <p className="text-sm"><span className="font-semibold">عدد الصور:</span> {form.imagePaths.length}</p>

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      disabled={isSubmitting || isUploading}
                      onClick={() => void submitWithStatus('draft')}
                      className="h-11 px-5 rounded-lg border border-[#7B57C8] text-[#7B57C8] font-bold disabled:opacity-60"
                    >
                      {isSubmitting ? 'جارٍ الحفظ...' : 'حفظ كمسودة'}
                    </button>
                    <button
                      disabled={isSubmitting || isUploading}
                      onClick={() => void submitWithStatus('published')}
                      className="h-11 px-5 rounded-lg bg-[#7B57C8] text-white font-bold hover:opacity-90 disabled:opacity-60"
                    >
                      {isSubmitting ? 'جارٍ النشر...' : 'نشر المنتج'}
                    </button>
                  </div>
                </div>
              )}

              {error && <p className="text-red-600 text-sm mt-4">{error}</p>}

              <div className="mt-6 flex gap-3">
                {step > 0 && (
                  <button
                    disabled={isSubmitting}
                    onClick={previousStep}
                    className="h-11 px-5 rounded-lg border border-[#9CA3AF] text-[#4B5563] font-bold disabled:opacity-60"
                  >
                    السابق
                  </button>
                )}
                {step < STEPS.length - 1 && (
                  <button
                    disabled={isSubmitting}
                    onClick={nextStep}
                    className="h-11 px-5 rounded-lg bg-[#7B57C8] text-white font-bold disabled:opacity-60"
                  >
                    التالي
                  </button>
                )}
                <button
                  disabled={isSubmitting}
                  onClick={resetForm}
                  className="h-11 px-5 rounded-lg border border-[#D1D5DB] text-[#6B7280] font-bold disabled:opacity-60"
                >
                  تفريغ
                </button>
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
                            {categoryOptions.find((c) => c.id === product.category)?.name}
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
              <button onClick={() => void runConfirmAction()} className="flex-1 h-11 rounded-lg bg-[#DC2626] text-white font-bold hover:opacity-90 transition">تأكيد الحذف</button>
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
                <label className="block mb-2 text-sm font-semibold text-[#1F1F1F]">
                  اسم المنتج <span className="text-[12px] font-medium text-[#9CA3AF]">(اختياري)</span>
                </label>
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
                  onChange={(e) =>
                    setEditForm((prev) => {
                      const nextCategory = e.target.value as CategoryId
                      const nextTypeOptions = marketOptions?.subcategoriesByCategory[nextCategory] || []
                      const keepCurrentType = prev.productType !== 'عام' && nextTypeOptions.includes(prev.productType)
                      return {
                        ...prev,
                        category: nextCategory,
                        productType: keepCurrentType ? prev.productType : nextTypeOptions[0] || 'عام',
                      }
                    })
                  }
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  {categoryOptions.map((category) => (
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
                  {governorateOptions.map((governorate) => (
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
                <select
                  value={editForm.productType}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, productType: e.target.value }))}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  <option value="عام">عام</option>
                  {editSubcategoryOptions.map((subcategory) => (
                    <option key={subcategory} value={subcategory}>
                      {subcategory}
                    </option>
                  ))}
                </select>
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
              <button
                type="button"
                disabled={isUploading}
                onClick={() => editFileInputRef.current?.click()}
                className="h-10 px-4 rounded-lg bg-[#7B57C8] text-white font-bold hover:opacity-90 transition disabled:opacity-60"
              >
                {isUploading ? 'جارٍ رفع الصور...' : 'إضافة صور'}
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
              <button onClick={() => void saveEditModal()} className="h-11 px-5 rounded-lg bg-[#7B57C8] text-white font-bold hover:opacity-90 transition">
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
