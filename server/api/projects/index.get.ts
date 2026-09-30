import type { Part } from '#shared/types/project'

/** All company projects, or only mine with ?mine=true. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const mine = getQuery(event).mine === 'true'

  const query = mine ? projectsCol().where('createdBy', '==', user.uid) : projectsCol()
  const [projects, parts] = await Promise.all([
    query.get(),
    useFirestore().collectionGroup('parts').get()
  ])

  const byProject = new Map<string, Part[]>()
  for (const doc of parts.docs) {
    const projectId = doc.ref.parent.parent!.id
    byProject.set(projectId, [...(byProject.get(projectId) ?? []), toPart(doc)])
  }

  return projects.docs
    .map(doc => toProject(doc, byProject.get(doc.id)))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
})
