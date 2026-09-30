import { FieldValue } from 'firebase-admin/firestore'
import { CAR_CATALOG } from '#shared/data/carCatalog'

export type CatalogBrand = { name: string, models: string[] }
type Custom = { brand: string, model: string }

const ref = () => useFirestore().collection('settings').doc('catalog')
const norm = (s: string) => s.trim().toLowerCase()

async function loadCustom(): Promise<Custom[]> {
  return ((await ref().get()).data()?.custom as Custom[] | undefined) ?? []
}

/** Built-in brands and models merged with those colleagues added. */
export async function loadCatalog(): Promise<CatalogBrand[]> {
  const brands = new Map<string, Set<string>>(Object.entries(CAR_CATALOG).map(([b, models]) => [b, new Set(models)]))
  for (const { brand, model } of await loadCustom()) {
    const canonical = [...brands.keys()].find(b => norm(b) === norm(brand)) ?? brand
    if (!brands.has(canonical)) brands.set(canonical, new Set())
    if (model) brands.get(canonical)!.add(model)
  }
  return [...brands.entries()]
    .map(([name, models]) => ({ name, models: [...models].sort((a, b) => a.localeCompare(b, 'nl', { numeric: true })) }))
    .sort((a, b) => a.name.localeCompare(b.name))
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
    await ref().set({ custom: FieldValue.arrayUnion({ brand: result.make, model: result.model }) }, { merge: true })
  }
  return result
}
