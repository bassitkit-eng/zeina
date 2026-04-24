'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppHeader } from '@/components/shared/AppHeader'
import { useAuth } from '@/app/contexts/AuthContext'

type DeleteReport = {
  deletedUserId: string
  beforeDelete: {
    vendorProfiles: number
    products: number
    storagePaths: number
  }
  supabaseAfterDelete: {
    profileExists: boolean
    vendorProfilesRemaining: number
    productsRemaining: number
    productImagesRemaining: number
  }
  r2: {
    cleanupTriggered: boolean
    cleanupResponse: unknown
    cleanupError: string
    checkedCount: number
    deletedCount: number
    remainingPathsSample: string[]
  }
}

export default function AccountTaskPage() {
  const router = useRouter()
  const { isLoading, user, session, signOut } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState('')
  const [report, setReport] = useState<DeleteReport | null>(null)

  useEffect(() => {
    if (isLoading) return
    if (!user) router.replace('/auth')
  }, [isLoading, user, router])

  const deleteAccount = async () => {
    const ok = window.confirm('هل أنت متأكد من حذف الحساب نهائيًا؟ سيتم حذف كل البيانات والصور المرتبطة به.')
    if (!ok) return
    if (!session?.access_token) {
      setError('جلسة الدخول غير متاحة. سجل الدخول مرة أخرى.')
      return
    }

    setIsDeleting(true)
    setError('')
    setReport(null)

    try {
      const response = await fetch('/api/account/delete', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })
      const data = (await response.json()) as { success: boolean; message?: string; report?: DeleteReport }
      if (!response.ok || !data.success || !data.report) {
        throw new Error(data.message || 'فشل حذف الحساب.')
      }

      setReport(data.report)
      await signOut()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'حدث خطأ غير متوقع.')
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF9F7]">
        <AppHeader />
      </main>
    )
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#FAF9F7]">
        <AppHeader />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF9F7]">
      <AppHeader />
      <section className="px-4 py-10" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="rounded-2xl border border-[#FECACA] bg-[#FFF1F2] p-5">
            <h1 className="text-2xl font-bold text-[#7F1D1D]">مهمة حذف الحساب والتحقق</h1>
            <p className="text-sm text-[#7F1D1D] mt-2">
              عند الضغط على الزر سيتم حذف الحساب من Supabase ثم تشغيل تنظيف Cloudflare R2 وإظهار تقرير تحقق.
            </p>
            <button
              type="button"
              onClick={() => void deleteAccount()}
              disabled={isDeleting}
              className="mt-4 h-11 px-6 rounded-lg bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C] transition disabled:opacity-60"
            >
              {isDeleting ? 'جارٍ حذف الحساب والتحقق...' : 'Delete Account'}
            </button>
          </div>

          {error && <div className="rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] p-4 text-[#B91C1C]">{error}</div>}

          {report && (
            <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 space-y-3">
              <h2 className="text-xl font-bold text-[#1F1F1F]">تقرير التنفيذ</h2>
              <p className="text-sm text-[#374151]">User ID: {report.deletedUserId}</p>

              <div className="text-sm text-[#374151]">
                <p className="font-bold text-[#111827]">قبل الحذف</p>
                <p>Vendor Profiles: {report.beforeDelete.vendorProfiles}</p>
                <p>Products: {report.beforeDelete.products}</p>
                <p>Storage Paths: {report.beforeDelete.storagePaths}</p>
              </div>

              <div className="text-sm text-[#374151]">
                <p className="font-bold text-[#111827]">Supabase بعد الحذف</p>
                <p>profileExists: {String(report.supabaseAfterDelete.profileExists)}</p>
                <p>vendorProfilesRemaining: {report.supabaseAfterDelete.vendorProfilesRemaining}</p>
                <p>productsRemaining: {report.supabaseAfterDelete.productsRemaining}</p>
                <p>productImagesRemaining: {report.supabaseAfterDelete.productImagesRemaining}</p>
              </div>

              <div className="text-sm text-[#374151]">
                <p className="font-bold text-[#111827]">Cloudflare R2</p>
                <p>cleanupTriggered: {String(report.r2.cleanupTriggered)}</p>
                <p>cleanupError: {report.r2.cleanupError || '-'}</p>
                <p>checkedCount: {report.r2.checkedCount}</p>
                <p>deletedCount: {report.r2.deletedCount}</p>
                {report.r2.remainingPathsSample.length > 0 && (
                  <div>
                    <p className="font-semibold mt-1">مسارات ما زالت موجودة (عينة):</p>
                    <ul className="list-disc pr-5">
                      {report.r2.remainingPathsSample.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

