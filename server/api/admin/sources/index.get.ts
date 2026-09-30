import { listSources } from '../../../sourcing/settings'

export default defineEventHandler(async (event) => {
  await requireUser(event, { admin: true })
  return listSources()
})
