import { type CategoryId } from '@/lib/catalog'

export const HERO_SLIDES = [
  {
    title: 'لأن لحظاتك تستحق الأفضل',
    description:
      'في زينة نهتم بالجودة والتفاصيل، لتجد منتجات تعكس شخصيتك وتترك أثرًا لا يُنسى في مناسبتك الخاصة.',
  },
  {
    title: 'تنوع يلبي كل الأذواق',
    description:
      'من الكوشات الفخمة إلى المرايا والدعوات الأنيقة، نوفر لك خيارات واسعة تناسب جميع الأذواق والمناسبات.',
  },
  {
    title: 'زينة.. لمناسبات تبقى في الذاكرة',
    description:
      'ابدأ رحلتك الآن مع زينة، واختر من بين أجمل المنتجات لتصنع لحظاتك المميزة.',
  },
] as const

export const CATEGORY_IMAGES: Record<CategoryId, string> = {
  kosha: '/images/koshat.jpg',
  mirrors: '/images/mirr.jpg',
  cakes: '/images/cake.jpg',
}

export const CATEGORY_CARD_COPY: Record<CategoryId, { title: string; subtitle: string }> = {
  kosha: {
    title: 'كوشات',
    subtitle: 'تصاميم فريدة لحفلاتكم',
  },
  mirrors: {
    title: 'مرايا',
    subtitle: 'لمسات أنيقة تزيد سحر المكان',
  },
  cakes: {
    title: 'تورتات وأنواع الشوكولاتة',
    subtitle: 'تورتات وشوكولاتة مخصصة ومميزة',
  },
}
