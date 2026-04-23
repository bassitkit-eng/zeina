'use client'

import { FormEvent, useState } from 'react'
import { AppHeader } from '@/components/shared/AppHeader'

export default function CompleteProfilePage() {
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [accountType, setAccountType] = useState<'user' | 'vendor'>('user')
  const [message, setMessage] = useState('')

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!fullName.trim() || !phone.trim()) {
      setMessage('برجاء إدخال الاسم ورقم الهاتف.')
      return
    }
    setMessage('تم حفظ بيانات الحساب بنجاح (واجهة تجريبية).')
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />
      <section className="px-4 py-12" dir="rtl">
        <div className="max-w-2xl mx-auto rounded-2xl bg-white border border-[#E5E7EB] p-6">
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-2">إكمال الحساب</h1>
          <p className="text-[#6B7280] mb-6">أكمل بياناتك الأساسية قبل استخدام المنصة.</p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-extrabold text-black">الاسم الكامل</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="مثال: أحمد محمد"
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-extrabold text-black">رقم الهاتف</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="مثال: 01012345678"
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-extrabold text-black">نوع الحساب</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as 'user' | 'vendor')}
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              >
                <option value="user">مستخدم عادي</option>
                <option value="vendor">بائع</option>
              </select>
            </div>

            <button type="submit" className="h-11 px-6 rounded-lg bg-[#7B57C8] text-white font-bold hover:bg-[#6E4DB5] transition">
              حفظ البيانات
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-[#4B5563]">{message}</p>}
        </div>
      </section>
    </main>
  )
}

