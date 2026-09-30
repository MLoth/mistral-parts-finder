import { isProviderId } from '../../../../ai/registry'
import { loadSettings, removeProvider, saveSettings } from '../../../../ai/settings'

export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const id = getRouterParam(event, 'id')!
  if (!isProviderId(id)) throw createError({ statusCode: 404, statusMessage: 'Onbekende provider' })

  await removeProvider(id)
  const settings = await loadSettings()
  if (settings.defaultProvider === id) {
    const next = (Object.keys(settings.providers) as (typeof id)[]).find(p => p !== id) ?? null
    await saveSettings({ defaultProvider: next })
  }
  return { ok: true }
})
