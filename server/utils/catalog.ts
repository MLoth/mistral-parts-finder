import { CAR_CATALOG } from '#shared/data/carCatalog'

export type CatalogBrand = { name: string, models: string[] }

const ref = () => useFirestore().collection('settings').doc('catalog')
const norm = (s: string) => s.trim().toLowerCase()
const byName = (a: CatalogBrand, b: CatalogBrand) => a.name.localeCompare(b.name)
const byModel = (a: string, b: string) => a.localeCompare(b, 'nl', { numeric: true })

function tidy(brands: CatalogBrand[]): CatalogBrand[] {
  return brands.map(b => ({ name: b.name, models: [...new Set(b.models)].sort(byModel) })).sort(byName)
}

/**
 * The catalogue lives in Firestore so admins can edit it. The built-in list
 * (shared/data/carCatalog.ts) is only the starting point: it is copied over on first use,
 * together with anything colleagues added before the admin page existed.
 */
export async function loadCatalog(): Promise<CatalogBrand[]> {
  const doc = await ref().get()
  const stored = doc.data()?.brands as CatalogBrand[] | undefined
  if (stored) return tidy(stored)

  const brands = new Map<string, Set<string>>(Object.entries(CAR_CATALOG).map(([b, models]) => [b, new Set(models)]))
  for (const { brand, model } of (doc.data()?.custom ?? []) as { brand: string, model: string }[]) {
    const name = [...brands.keys()].find(b => norm(b) === norm(brand)) ?? brand
    if (!brands.has(name)) brands.set(name, new Set())
    if (model) brands.get(name)!.add(model)
  }
  const seeded = tidy([...brands.entries()].map(([name, models]) => ({ name, models: [...models] })))
  await ref().set({ brands: seeded }, { merge: true })
  return seeded
}

export async function saveCatalog(brands: CatalogBrand[]) {
  await ref().set({ brands: tidy(brands) }, { merge: true })
}

/**
 * Fixes the casing of a brand/type to the catalogue spelling ("jaguar" becomes "Jaguar"),
 * and adds it to the shared catalogue when it is new.
 */
export async function canonicalCar(make: string, model: string) {
  const catalog = await loadCatalog()
  const brand = catalog.find(b => norm(b.name) === norm(make))
  const knownModel = brand?.models.find(m => norm(m) === norm(model))
  const result = { make: brand?.name ?? make.trim(), model: knownModel ?? model.trim() }

  if (!brand || !knownModel) {
    const next = brand
      ? catalog.map(b => (b === brand ? { ...b, models: [...b.models, result.model] } : b))
      : [...catalog, { name: result.make, models: [result.model] }]
    await saveCatalog(next)
  }
  return result
}
