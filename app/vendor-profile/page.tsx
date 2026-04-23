'use client'

import { FormEvent, useState } from 'react'
import { AppHeader } from '@/components/shared/AppHeader'
import { getAreasByGovernorate, GOVERNORATE_OPTIONS } from '@/lib/egyptLocations'

export default function VendorProfilePage() {
  const [businessName, setBusinessName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [instagram, setInstagram] = useState('')
  const [facebook, setFacebook] = useState('')
  const [tiktok, setTiktok] = useState('')
  const [governorate, setGovernorate] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  const [message, setMessage] = useState('')

  const cities = governorate ? getAreasByGovernorate(governorate) : []

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!businessName.trim() || !phone.trim()) {
      setMessage('برجاء إدخال اسم النشاط ورقم الهاتف.')
      return
    }
    setMessage('تم حفظ بروفايل البائع بنجاح (واجهة تجريبية).')
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />
      <section className="px-4 py-12" dir="rtl">
        <div className="max-w-4xl mx-auto rounded-2xl bg-white border border-[#E5E7EB] p-6">
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-2">بروفايل البائع</h1>
          <p className="text-[#6B7280] mb-6">هذه البيانات تُستخدم تلقائيًا عند إضافة منتجات جديدة.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-extrabold text-black">اسم النشاط</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="مثال: Zeina Events"
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-extrabold text-black">وصف النشاط</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="نبذة قصيرة عن خدماتك"
                className="w-full rounded-lg border border-[#DCCAB2] bg-white p-3 text-[#1F1F1F]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-2 text-sm font-extrabold text-black">رقم الهاتف</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-extrabold text-black">رقم الواتساب</label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+201012345678"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block mb-2 text-sm font-extrabold text-black">إنستجرام</label>
                <input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@zeina_store"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-extrabold text-black">فيسبوك</label>
                <input
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="facebook.com/zeina"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-extrabold text-black">تيك توك</label>
                <input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="@zeina.events"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-2 text-sm font-extrabold text-black">المحافظة</label>
                <select
                  value={governorate}
                  onChange={(e) => {
                    setGovernorate(e.target.value)
                    setCity('')
                  }}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  <option value="">اختر المحافظة</option>
                  {GOVERNORATE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-extrabold text-black">المدينة / المنطقة</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  disabled={!governorate}
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                >
                  <option value="">{governorate ? 'اختر المدينة / المنطقة' : 'اختر المحافظة أولًا'}</option>
                  {cities.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-extrabold text-black">العنوان التفصيلي</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="مثال: شارع النصر - مدينة نصر - القاهرة"
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              />
            </div>

            <button type="submit" className="h-11 px-6 rounded-lg bg-[#7B57C8] text-white font-bold hover:bg-[#6E4DB5] transition">
              حفظ بروفايل البائع
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-[#4B5563]">{message}</p>}
        </div>
      </section>
    </main>
  )
}

