type Car = { make: string, model: string, year: number | null }

/** "1965 Jaguar E-Type" */
export const carLabel = (p: Car) => [p.year, p.make, p.model].filter(Boolean).join(' ')

/** The project's own name if it has one, otherwise the car. */
export const projectTitle = (p: Car & { name?: string }) => p.name?.trim() || carLabel(p) || 'Project'
