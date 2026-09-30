export type CatalogBrand = { name: string, models: string[] }

/** Brands and types (built-in plus what colleagues added), loaded once. */
export function useCatalog() {
  const api = useApi()
  return useAsyncData('catalog', () => api<CatalogBrand[]>('/api/catalog'), { server: false, default: () => [] })
}
