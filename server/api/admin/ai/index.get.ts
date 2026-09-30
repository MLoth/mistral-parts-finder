import { settingsView } from '../../../ai/settings'
import { usageSummary } from '../../../ai/usage'

export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  const [settings, usage] = await Promise.all([settingsView(), usageSummary(30)])
  return { settings, usage }
})
