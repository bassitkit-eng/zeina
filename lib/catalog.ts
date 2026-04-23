export type CategoryId = 'kosha' | 'mirrors' | 'cakes'

export interface Product {
  id: number
  name: string
  price: number
  location: string
  city: string
  category: CategoryId
  productType: string
  imagePath: string
  imagePaths?: string[]
  description?: string
}

export const CATEGORY_NAMES: Record<CategoryId, string> = {
  kosha: 'كوشات',
  mirrors: 'المرايا',
  cakes: 'تورتات',
}

export const CATEGORIES = [
  { id: 'kosha' as const, name: CATEGORY_NAMES.kosha },
  { id: 'mirrors' as const, name: CATEGORY_NAMES.mirrors },
  { id: 'cakes' as const, name: CATEGORY_NAMES.cakes },
]

export const PRODUCTS_BY_CATEGORY: Record<CategoryId, Product[]> = {
  kosha: [
    { id: 1, name: 'كوشة ذهبية', price: 2500, location: 'جميرا', city: 'دبي', category: 'kosha', productType: 'زفاف', imagePath: '/image/B/kosha/kosha-1.webp', description: 'كوشة ذهبية أنيقة بتفاصيل فاخرة.' },
    { id: 2, name: 'كوشة فضية', price: 2000, location: 'الخالدية', city: 'أبوظبي', category: 'kosha', productType: 'خطوبة', imagePath: '/image/B/kosha/kosha-2.webp', description: 'تصميم راقٍ بلمسة عصرية لليلة الزفاف.' },
    { id: 3, name: 'كوشة اللؤلؤ', price: 3000, location: 'داون تاون', city: 'دبي', category: 'kosha', productType: 'زفاف', imagePath: '/image/B/kosha/kosha-3.webp', description: 'تفاصيل ناعمة مستوحاة من اللؤلؤ لإطلالة ملكية.' },
    { id: 4, name: 'كوشة ملكية', price: 3500, location: 'المجاز', city: 'الشارقة', category: 'kosha', productType: 'خطوبة', imagePath: '/image/B/kosha/kosha-4.png', description: 'خيار فاخر للمناسبات الكبيرة والاحتفالات المميزة.' },
  ],
  mirrors: [
    { id: 5, name: 'مرآة كريستال', price: 1500, location: 'ديرة', city: 'دبي', category: 'mirrors', productType: 'زفاف', imagePath: '/image/B/mirrors/mirrors-1.jpg', description: 'مرآة كريستالية بإطار أنيق ولمعان فاخر.' },
    { id: 6, name: 'مرآة بإطار ذهبي', price: 2200, location: 'المرور', city: 'أبوظبي', category: 'mirrors', productType: 'خطوبة', imagePath: '/image/B/mirrors/mirrors-2.jpg', description: 'إطار ذهبي مميز يضيف فخامة للديكور.' },
    { id: 7, name: 'مرآة عتيقة', price: 1800, location: 'السطوة', city: 'دبي', category: 'mirrors', productType: 'زفاف', imagePath: '/image/B/mirrors/mirrors-3.jpg', description: 'طابع كلاسيكي لعشاق الأسلوب العتيق.' },
    { id: 8, name: 'مرآة ماسية', price: 2800, location: 'النهدة', city: 'الشارقة', category: 'mirrors', productType: 'خطوبة', imagePath: '/image/B/mirrors/mirrors-4.png', description: 'تصميم هندسي أنيق ولمسة حديثة.' },
  ],
  cakes: [
    { id: 9, name: 'برج الشوكولاتة', price: 800, location: 'البرشاء', city: 'دبي', category: 'cakes', productType: 'زفاف', imagePath: '/image/B/cakes/cakes-1.png', description: 'كيكة متعددة الطبقات لعشاق الشوكولاتة.' },
    { id: 10, name: 'حلم الفانيليا', price: 900, location: 'المشرف', city: 'أبوظبي', category: 'cakes', productType: 'خطوبة', imagePath: '/image/B/cakes/cakes-2.png', description: 'كيكة فانيليا بنكهة ناعمة ومظهر كلاسيكي.' },
    { id: 11, name: 'حديقة الورود', price: 1200, location: 'القوز', city: 'دبي', category: 'cakes', productType: 'زفاف', imagePath: '/image/B/cakes/cakes-3.png', description: 'تصميم زهري أنيق يناسب حفلات الزفاف.' },
    { id: 12, name: 'الأناقة الذهبية', price: 1500, location: 'اليرموك', city: 'الشارقة', category: 'cakes', productType: 'خطوبة', imagePath: '/image/B/cakes/cakes-4.jpeg', description: 'تفاصيل ذهبية ولمسة فاخرة للمناسبات الراقية.' },
  ],
}

export const ALL_PRODUCTS: Product[] = Object.values(PRODUCTS_BY_CATEGORY).flat()
