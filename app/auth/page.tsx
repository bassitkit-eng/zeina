'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/shared/AppHeader'
import { supabaseClient } from '@/lib/supabase/client'

export default function AuthPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!email.trim() || !password.trim()) {
      setMessage('برجاء إدخال البريد الإلكتروني وكلمة المرور.')
      return
    }

    if (mode === 'register' && !name.trim()) {
      setMessage('برجاء إدخال الاسم الكامل.')
      return
    }

    setIsSubmitting(true)

    try {
      if (mode === 'register') {
        const { data, error } = await supabaseClient.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: name.trim(),
              phone: phone.trim(),
            },
          },
        })

        if (error) {
          setMessage(error.message)
          return
        }

        if (data.session) {
          setMessage('تم إنشاء الحساب وتسجيل الدخول بنجاح.')
          router.push('/complete-profile')
          return
        }

        setMessage('تم إنشاء الحساب بنجاح. تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجل الدخول.')
        return
      }

      const { error } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        setMessage(error.message)
        return
      }

      setMessage('تم تسجيل الدخول بنجاح.')
      router.push('/vendor-dashboard')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />
      <section className="px-4 py-12" dir="rtl">
        <div className="max-w-md mx-auto rounded-2xl bg-white border border-[#E5E7EB] p-6">
          <h1 className="text-3xl font-bold text-[#1F1F1F] mb-5">{mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب'}</h1>

          <div className="mb-5 flex items-center gap-2 rounded-xl bg-[#F3F4F6] p-1">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`h-10 flex-1 rounded-lg font-bold ${mode === 'login' ? 'bg-[#7B57C8] text-white' : 'text-[#4B5563]'}`}
            >
              تسجيل الدخول
            </button>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`h-10 flex-1 rounded-lg font-bold ${mode === 'register' ? 'bg-[#7B57C8] text-white' : 'text-[#4B5563]'}`}
            >
              إنشاء حساب
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block mb-2 text-sm font-extrabold text-black">الاسم الكامل</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
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
              </>
            )}

            <div>
              <label className="block mb-2 text-sm font-extrabold text-black">البريد الإلكتروني</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="example@email.com"
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-extrabold text-black">كلمة المرور</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="********"
                className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-lg bg-[#7B57C8] text-white font-bold hover:bg-[#6E4DB5] transition disabled:opacity-60"
            >
              {isSubmitting ? 'جارٍ التنفيذ...' : mode === 'login' ? 'دخول' : 'إنشاء الحساب'}
            </button>
          </form>

          {message && <p className="mt-4 text-sm text-[#4B5563]">{message}</p>}
        </div>
      </section>
    </main>
  )
}
