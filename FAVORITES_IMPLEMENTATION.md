# نظام المفضلة - Favorites System

تم تنفيذ نظام المفضلة الكامل لموقع Zeina باستخدام React + Tailwind CSS.

## المميزات المنفذة

### 1. ✅ Favorites Context Provider
- ملف: `/app/contexts/FavoritesContext.tsx`
- توفير state management محلي باستخدام React Context
- حفظ المفضلات في localStorage تلقائياً
- مشاركة الحالة بين جميع الصفحات

### 2. ✅ أيقونة المفضلة في الهيدر
- موجودة في جميع الصفحات
- تعرض عدد المنتجات المضافة للمفضلة كـ badge
- رابط مباشر لصفحة المفضلة

### 3. ✅ زر القلب في Product Cards
- يظهر في:
  - الصفحة الرئيسية
  - صفحات الفئات
  - صفحة تفاصيل المنتج
- Toggle functionality:
  - ♡ (قلب فارغ) عند عدم إضافة المنتج للمفضلة
  - ♥ (قلب ممتلئ) عند إضافة المنتج للمفضلة
- تغيير اللون عند الضغط

### 4. ✅ صفحة المفضلة
- ملف: `/app/favorites/page.tsx`
- عرض جميع المنتجات المفضلة المضافة
- نفس تصميم Product Cards
- Empty State: رسالة جميلة عند عدم وجود مفضلات

### 5. ✅ السلوك المطلوب
- إضافة/حذف من المفضلة يظهر فوراً في جميع الصفحات
- المفضلات تبقى محفوظة حتى بعد إغلاق المتصفح (localStorage)
- التحديث الفوري للعدد في الهيدر

## الملفات المعدّلة والمنشأة

### ملفات جديدة:
- `/app/contexts/FavoritesContext.tsx` - Context للمفضلات
- `/app/favorites/page.tsx` - صفحة المفضلة

### ملفات معدّلة:
- `/app/layout.tsx` - إضافة FavoritesProvider
- `/app/page.tsx` - إضافة أيقونة المفضلة والقلب
- `/app/category/[id]/page.tsx` - إضافة زر القلب
- `/app/product/[id]/page.tsx` - إضافة زر القلب

## الاستخدام

### للمستخدم:
1. اضغط على أيقونة ♡ لإضافة المنتج للمفضلة
2. سيتغير ♡ إلى ♥ وتغيير اللون
3. زر المفضلة في الهيدر يعرض عدد المنتجات
4. اذهب إلى صفحة المفضلة لعرض جميع المنتجات المفضلة

### للمطورين:
```typescript
// استخدام الـ hook
import { useFavorites } from '@/app/contexts/FavoritesContext'

const { favorites, toggleFavorite, isFavorite } = useFavorites()

// التحقق من الحالة
if (isFavorite(productId)) {
  // المنتج مضاف للمفضلة
}

// إضافة/حذف
toggleFavorite(productId)
```

## التقنيات المستخدمة:
- React Context API
- localStorage
- useState/useEffect Hooks
- Tailwind CSS
- Dynamic styling
