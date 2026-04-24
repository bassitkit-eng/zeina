'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/shared/AppHeader'
import { supabaseClient } from '@/lib/supabase/client'
import { useAuth, type AppRole } from '@/app/contexts/AuthContext'

async function withTimeout<T>(promise: Promise<T>, timeoutMs = 4000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
    }),
  ])
}

async function withAuthTimeout<T>(promise: Promise<T>, timeoutMs = 12000): Promise<T> {
  return await Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error('انتهت مهلة الطلب. حاول مرة أخرى.')), timeoutMs)
    }),
  ])
}

async function upsertProfileRole(params: { userId: string; email: string | null; role: AppRole }) {
  const { error } = await supabaseClient.from('profiles').upsert(
    {
      id: params.userId,
      email: params.email,
      role: params.role,
      status: 'active',
    },
    { onConflict: 'id' }
  )

  if (error) throw error
}

async function getProfileRole(userId: string): Promise<AppRole | null> {
  const { data, error } = await supabaseClient.from('profiles').select('role').eq('id', userId).maybeSingle()
  if (error || !data?.role) return null
  return data.role as AppRole
}

export default function AuthPage() {
  const router = useRouter()
  const { isLoading, user, refreshRole } = useAuth()
  const registrationRole: AppRole = 'vendor'

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (isLoading) return
    if (user) router.replace('/')
  }, [isLoading, user, router])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')

    if (!email.trim() || !password.trim()) {
      setMessage('برجاء إدخال البريد الإلكتروني وكلمة المرور.')
      return
    }

    if (mode === 'register') {
      if (!confirmPassword.trim()) {
        setMessage('برجاء إدخال تأكيد كلمة المرور.')
        return
      }

      if (password !== confirmPassword) {
        setMessage('كلمة المرور وتأكيد كلمة المرور غير متطابقين.')
        return
      }
    }

    setIsSubmitting(true)

    try {
      if (mode === 'register') {
        const { data, error } = await withAuthTimeout(
          supabaseClient.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                role: registrationRole,
              },
            },
          }),
          12000
        )

        if (error) {
          setMessage(error.message)
          return
        }

        if (data.user && data.session) {
          void withTimeout(
            upsertProfileRole({ userId: data.user.id, email: data.user.email ?? email.trim(), role: registrationRole }),
            4000
          ).catch(() => null)
          void withTimeout(refreshRole(), 4000).catch(() => null)
          router.replace('/')
          return
        }

        setMessage('تم إنشاء الحساب بنجاح. الآن قم بتسجيل الدخول.')
        setMode('login')
        return
      }

      const { data, error } = await withAuthTimeout(
        supabaseClient.auth.signInWithPassword({
          email: email.trim(),
          password,
        }),
        12000
      )

      if (error) {
        setMessage(error.message)
        return
      }

      const roleFromProfile = await withAuthTimeout(getProfileRole(data.user.id), 6000)
      const roleFromMetadata = (data.user?.user_metadata?.role as AppRole | undefined) ?? 'vendor'
      const resolvedRole = roleFromProfile ?? roleFromMetadata

      if (!roleFromProfile) {
        void withTimeout(
          upsertProfileRole({
            userId: data.user.id,
            email: data.user.email ?? email.trim(),
            role: resolvedRole,
          }),
          4000
        ).catch(() => null)
      }

      void withTimeout(refreshRole(), 4000).catch(() => null)
      router.replace('/')
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'حدث خطأ غير متوقع. حاول مرة أخرى.')
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

            {mode === 'register' && (
              <div>
                <label className="block mb-2 text-sm font-extrabold text-black">تأكيد كلمة المرور</label>
                <input
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  type="password"
                  placeholder="********"
                  className="w-full h-11 rounded-lg border border-[#DCCAB2] bg-white px-3 text-[#1F1F1F]"
                />
              </div>
            )}

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
