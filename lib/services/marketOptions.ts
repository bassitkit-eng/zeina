import { CATEGORIES, type CategoryId } from '@/lib/catalog'
import { EGYPT_GOVERNORATES, GOVERNORATE_OPTIONS } from '@/lib/egyptLocations'
import { supabaseClient } from '@/lib/supabase/client'

type CategoryRow = {
  id: string
  name: string | null
  slug: string | null
}

type SubcategoryRow = {
  category_id: string | null
  name: string | null
  slug: string | null
}

type GovernorateRow = {
  id: string
  name_ar: string | null
  name_en: string | null
}

type CityRow = {
  governorate_id: string | null
  name_ar: string | null
  name_en: string | null
}

export type MarketOptions = {
  categories: Array<{ id: CategoryId; name: string }>
  subcategoriesByCategory: Record<CategoryId, string[]>
  governorates: string[]
  citiesByGovernorate: Record<string, string[]>
}

function normalizeText(value: string | null | undefined) {
  return (value || '').trim().toLowerCase()
}

function asCategoryId(category: CategoryRow): CategoryId | null {
  const slug = normalizeText(category.slug)
  const name = normalizeText(category.name)

  if (slug === 'kosha' || slug.includes('kosh') || slug.includes('kocha') || name.includes('كوش')) return 'kosha'
  if (slug === 'mirrors' || slug === 'mirror' || slug.includes('mirror') || name.includes('مرا')) return 'mirrors'
  if (slug === 'cakes' || slug === 'cake' || slug.includes('cake') || slug.includes('tort') || name.includes('تورت')) return 'cakes'

  return null
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar'))
}

function fallbackCitiesByGovernorate() {
  const output: Record<string, string[]> = {}
  for (const governorate of GOVERNORATE_OPTIONS) {
    const normalized = governorate.replaceAll(' ', '_')
    output[governorate] = [...(EGYPT_GOVERNORATES[normalized] || [])]
  }
  return output
}

export async function fetchMarketOptions(): Promise<MarketOptions> {
  const fallback: MarketOptions = {
    categories: [...CATEGORIES],
    subcategoriesByCategory: { kosha: [], mirrors: [], cakes: [] },
    governorates: [...GOVERNORATE_OPTIONS],
    citiesByGovernorate: fallbackCitiesByGovernorate(),
  }

  try {
    const [
      { data: categories, error: categoriesError },
      { data: subcategories, error: subcategoriesError },
      { data: governorates, error: governoratesError },
      { data: cities, error: citiesError },
    ] = await Promise.all([
      supabaseClient.from('categories').select('id,name,slug').eq('is_active', true),
      supabaseClient.from('subcategories').select('category_id,name,slug').eq('is_active', true),
      supabaseClient.from('governorates').select('id,name_ar,name_en'),
      supabaseClient.from('cities').select('governorate_id,name_ar,name_en'),
    ])

    if (categoriesError || subcategoriesError || governoratesError || citiesError) {
      return fallback
    }

    const categoryRows = (categories || []) as CategoryRow[]
    const subcategoryRows = (subcategories || []) as SubcategoryRow[]
    const governorateRows = (governorates || []) as GovernorateRow[]
    const cityRows = (cities || []) as CityRow[]

    const dbCategoryIdToApp = new Map<string, CategoryId>()
    const categoryNameByApp: Record<CategoryId, string> = {
      kosha: CATEGORIES.find((c) => c.id === 'kosha')?.name || 'كوشات',
      mirrors: CATEGORIES.find((c) => c.id === 'mirrors')?.name || 'المرايا',
      cakes: CATEGORIES.find((c) => c.id === 'cakes')?.name || 'تورتات',
    }

    categoryRows.forEach((row) => {
      const appId = asCategoryId(row)
      if (!appId) return
      dbCategoryIdToApp.set(row.id, appId)
      if (row.name && row.name.trim()) categoryNameByApp[appId] = row.name.trim()
    })

    const subcategoriesByCategory: Record<CategoryId, string[]> = { kosha: [], mirrors: [], cakes: [] }
    subcategoryRows.forEach((row) => {
      if (!row.category_id || !row.name) return
      const appId = dbCategoryIdToApp.get(row.category_id)
      if (!appId) return
      subcategoriesByCategory[appId].push(row.name.trim())
    })
    subcategoriesByCategory.kosha = uniqueSorted(subcategoriesByCategory.kosha)
    subcategoriesByCategory.mirrors = uniqueSorted(subcategoriesByCategory.mirrors)
    subcategoriesByCategory.cakes = uniqueSorted(subcategoriesByCategory.cakes)

    const governorateNameById = new Map<string, string>()
    governorateRows.forEach((row) => {
      const name = (row.name_ar || row.name_en || '').trim()
      if (name) governorateNameById.set(row.id, name)
    })

    const citiesByGovernorate: Record<string, string[]> = {}
    cityRows.forEach((row) => {
      if (!row.governorate_id) return
      const governorateName = governorateNameById.get(row.governorate_id)
      if (!governorateName) return
      const cityName = (row.name_ar || row.name_en || '').trim()
      if (!cityName) return
      if (!citiesByGovernorate[governorateName]) citiesByGovernorate[governorateName] = []
      citiesByGovernorate[governorateName].push(cityName)
    })

    for (const key of Object.keys(citiesByGovernorate)) {
      citiesByGovernorate[key] = uniqueSorted(citiesByGovernorate[key])
    }

    const governoratesList = uniqueSorted(Object.values(governorateNameById))
    const mergedGovernorates = uniqueSorted([...governoratesList, ...GOVERNORATE_OPTIONS])

    for (const governorate of GOVERNORATE_OPTIONS) {
      if (!citiesByGovernorate[governorate]) {
        const normalized = governorate.replaceAll(' ', '_')
        citiesByGovernorate[governorate] = [...(EGYPT_GOVERNORATES[normalized] || [])]
      }
    }

    return {
      categories: [
        { id: 'kosha', name: categoryNameByApp.kosha },
        { id: 'mirrors', name: categoryNameByApp.mirrors },
        { id: 'cakes', name: categoryNameByApp.cakes },
      ],
      subcategoriesByCategory,
      governorates: mergedGovernorates,
      citiesByGovernorate,
    }
  } catch {
    return fallback
  }
}
