import type { PartSearch } from '#shared/types/search'
import type { Part, Project } from '#shared/types/project'

export async function loadPartContext(projectId: string, partId: string) {
  const projectDoc = await getProjectOr404(projectId)
  const partDoc = await projectDoc.ref.collection('parts').doc(partId).get()
  if (!partDoc.exists) throw createError({ statusCode: 404, statusMessage: 'Onderdeel niet gevonden' })
  return {
    projectDoc,
    partDoc,
    project: toProject(projectDoc, []) as Project,
    part: toPart(partDoc) as Part,
    searches: partDoc.ref.collection('searches')
  }
}

export const toSearch = (doc: FirebaseFirestore.DocumentSnapshot) => ({ id: doc.id, ...doc.data() }) as PartSearch
