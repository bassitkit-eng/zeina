export type CategoryId = 'kosha' | 'mirrors' | 'cakes'

export interface Product {
  id: number
  name: string
  price: number
  location: string
  category: CategoryId
  description?: string
}

export const CATEGORY_NAMES: Record<CategoryId, string> = {
  kosha: 'كوشات',
  mirrors: 'المرايا',
  cakes: 'الكعك',
}

export const CATEGORIES = [
  { id: 'kosha' as const, name: CATEGORY_NAMES.kosha },
  { id: 'mirrors' as const, name: CATEGORY_NAMES.mirrors },
  { id: 'cakes' as const, name: CATEGORY_NAMES.cakes },
]

export const PRODUCTS_BY_CATEGORY: Record<CategoryId, Product[]> = {
  kosha: [
    { id: 1, name: 'كوشة ذهبية', price: 2500, location: 'دبي', category: 'kosha', description: 'كوشة ذهبية أنيقة بتفاصيل فاخرة.' },
    { id: 2, name: 'كوشة فضية', price: 2000, location: 'أبوظبي', category: 'kosha', description: 'تصميم راقٍ بلمسة عصرية لليلة الزفاف.' },
    { id: 3, name: 'كوشة اللؤلؤ', price: 3000, location: 'دبي', category: 'kosha', description: 'تفاصيل ناعمة مستوحاة من اللؤلؤ لإطلالة ملكية.' },
    { id: 4, name: 'كوشة ملكية', price: 3500, location: 'الشارقة', category: 'kosha', description: 'خيار فاخر للمناسبات الكبيرة والاحتفالات المميزة.' },
  ],
  mirrors: [
    { id: 5, name: 'مرآة كريستال', price: 1500, location: 'دبي', category: 'mirrors', description: 'مرآة كريستالية بإطار أنيق ولمعان فاخر.' },
    { id: 6, name: 'مرآة بإطار ذهبي', price: 2200, location: 'أبوظبي', category: 'mirrors', description: 'إطار ذهبي مميز يضيف فخامة للديكور.' },
    { id: 7, name: 'مرآة عتيقة', price: 1800, location: 'دبي', category: 'mirrors', description: 'طابع كلاسيكي لعشاق الأسلوب العتيق.' },
    { id: 8, name: 'مرآة ماسية', price: 2800, location: 'الشارقة', category: 'mirrors', description: 'تصميم هندسي أنيق ولمسة حديثة.' },
  ],
  cakes: [
    { id: 9, name: 'برج الشوكولاتة', price: 800, location: 'دبي', category: 'cakes', description: 'كيكة متعددة الطبقات لعشاق الشوكولاتة.' },
    { id: 10, name: 'حلم الفانيليا', price: 900, location: 'أبوظبي', category: 'cakes', description: 'كيكة فانيليا بنكهة ناعمة ومظهر كلاسيكي.' },
    { id: 11, name: 'حديقة الورود', price: 1200, location: 'دبي', category: 'cakes', description: 'تصميم زهري أنيق يناسب حفلات الزفاف.' },
    { id: 12, name: 'الأناقة الذهبية', price: 1500, location: 'الشارقة', category: 'cakes', description: 'تفاصيل ذهبية ولمسة فاخرة للمناسبات الراقية.' },
  ],
}

export const ALL_PRODUCTS: Product[] = Object.values(PRODUCTS_BY_CATEGORY).flat()
