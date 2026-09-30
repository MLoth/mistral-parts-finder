/** Readable message from a failed $fetch call. */
export function apiError(error: unknown) {
  return (error as { data?: { statusMessage?: string } })?.data?.statusMessage
    ?? (error as { statusMessage?: string })?.statusMessage
    ?? 'Er ging iets mis'
}
