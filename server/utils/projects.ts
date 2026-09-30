import type { DocumentSnapshot } from 'firebase-admin/firestore'
import type { Part, Project } from '#shared/types/project'
import { SOURCED_STATUSES } from '#shared/types/project'

export const projectsCol = () => useFirestore().collection('projects')

export function toPart(doc: DocumentSnapshot): Part {
  return { id: doc.id, ...doc.data() } as Part
}

export function toProject(doc: DocumentSnapshot, parts: Part[] = []): Project {
  return {
    id: doc.id,
    ...doc.data(),
    partsTotal: parts.length,
    partsSourced: parts.filter(p => SOURCED_STATUSES.includes(p.status)).length
  } as Project
}

export async function getProjectOr404(id: string) {
  const doc = await projectsCol().doc(id).get()
  if (!doc.exists) throw createError({ statusCode: 404, statusMessage: 'Project niet gevonden' })
  return doc
}

export async function loadParts(projectId: string) {
  const snap = await projectsCol().doc(projectId).collection('parts').orderBy('createdAt').get()
  return snap.docs.map(toPart)
}
