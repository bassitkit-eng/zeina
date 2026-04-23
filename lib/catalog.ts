export type CategoryId = 'kosha' | 'mirrors' | 'cakes'
export type ProductStatus = 'draft' | 'published' | 'hidden' | 'soldout'
export type ProductId = string | number

export interface ProductContactInfo {
  phone?: string
  whatsapp?: string
  instagram?: string
  facebook?: string
  tiktok?: string
}

export interface Product {
  id: ProductId
  name: string
  price: number
  location: string
  city: string
  category: CategoryId
  productType: string
  imagePath: string
  imagePaths?: string[]
  imageStoragePaths?: string[]
  status?: ProductStatus
  description?: string
  contactInfo?: ProductContactInfo
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
    { id: 1, name: 'كوشة ذهبية', price: 2500, location: 'مدينة نصر', city: 'القاهرة', category: 'kosha', productType: 'زفاف', imagePath: '/image/B/kosha/kosha-1.webp', description: 'كوشة ذهبية أنيقة بتفاصيل فاخرة.' },
    { id: 2, name: 'كوشة فضية', price: 2000, location: 'المهندسين', city: 'الجيزة', category: 'kosha', productType: 'خطوبة', imagePath: '/image/B/kosha/kosha-2.webp', description: 'تصميم راق بلمسة عصرية لليلة مميزة.' },
    { id: 3, name: 'كوشة اللؤلؤ', price: 3000, location: 'سموحة', city: 'الإسكندرية', category: 'kosha', productType: 'زفاف', imagePath: '/image/B/kosha/kosha-3.webp', description: 'تفاصيل ناعمة مستوحاة من اللؤلؤ لإطلالة ملكية.' },
    { id: 4, name: 'كوشة ملكية', price: 3500, location: 'التجمع الخامس', city: 'القاهرة', category: 'kosha', productType: 'خطوبة', imagePath: '/image/B/kosha/kosha-4.png', description: 'خيار فاخر للمناسبات الكبيرة والاحتفالات المميزة.' },
  ],
  mirrors: [
    { id: 5, name: 'مرآة كريستال', price: 1500, location: 'العجمي', city: 'الإسكندرية', category: 'mirrors', productType: 'زفاف', imagePath: '/image/B/mirrors/mirrors-1.jpg', description: 'مرآة كريستالية بإطار أنيق ولمعان فاخر.' },
    { id: 6, name: 'مرآة بإطار ذهبي', price: 2200, location: 'الدقي', city: 'الجيزة', category: 'mirrors', productType: 'خطوبة', imagePath: '/image/B/mirrors/mirrors-2.jpg', description: 'إطار ذهبي مميز يضيف فخامة للديكور.' },
    { id: 7, name: 'مرآة عتيقة', price: 1800, location: 'حلوان', city: 'القاهرة', category: 'mirrors', productType: 'زفاف', imagePath: '/image/B/mirrors/mirrors-3.jpg', description: 'طابع كلاسيكي لعشاق الأسلوب العتيق.' },
    { id: 8, name: 'مرآة ماسية', price: 2800, location: 'طنطا', city: 'الغربية', category: 'mirrors', productType: 'خطوبة', imagePath: '/image/B/mirrors/mirrors-4.png', description: 'تصميم هندسي أنيق ولمسة حديثة.' },
  ],
  cakes: [
    { id: 9, name: 'برج الشوكولاتة', price: 800, location: 'الزقازيق', city: 'الشرقية', category: 'cakes', productType: 'زفاف', imagePath: '/image/B/cakes/cakes-1.png', description: 'كيكة متعددة الطبقات لعشاق الشوكولاتة.' },
    { id: 10, name: 'حلم الفانيليا', price: 900, location: 'المنصورة', city: 'الدقهلية', category: 'cakes', productType: 'خطوبة', imagePath: '/image/B/cakes/cakes-2.png', description: 'كيكة فانيليا بنكهة ناعمة ومظهر كلاسيكي.' },
    { id: 11, name: 'حديقة الورود', price: 1200, location: 'المعادي', city: 'القاهرة', category: 'cakes', productType: 'زفاف', imagePath: '/image/B/cakes/cakes-3.png', description: 'تصميم زهري أنيق يناسب حفلات الزفاف.' },
    { id: 12, name: 'الأناقة الذهبية', price: 1500, location: 'سيدي جابر', city: 'الإسكندرية', category: 'cakes', productType: 'خطوبة', imagePath: '/image/B/cakes/cakes-4.jpeg', description: 'تفاصيل ذهبية ولمسة فاخرة للمناسبات الراقية.' },
  ],
}

export const ALL_PRODUCTS: Product[] = Object.values(PRODUCTS_BY_CATEGORY).flat()
