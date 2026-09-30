/**
 * Polite fetching for sources that read web pages or APIs:
 * honours robots.txt, spaces requests per host, and always has a timeout.
 * Sources that scrape must go through this. Terms of service still need a human check per source.
 */
const USER_AGENT = 'MistralPartsFinder/1.0 (+https://www.mistralclassics.com)'
const MIN_INTERVAL_MS = 1500
const lastHit = new Map<string, number>()
const robotsCache = new Map<string, { at: number, disallow: string[] }>()

async function disallowedPaths(origin: string) {
  const cached = robotsCache.get(origin)
  if (cached && Date.now() - cached.at < 3_600_000) return cached.disallow

  let disallow: string[] = []
  try {
    const res = await fetch(`${origin}/robots.txt`, { headers: { 'user-agent': USER_AGENT }, signal: AbortSignal.timeout(5000) })
    if (res.ok) {
      let applies = false
      for (const raw of (await res.text()).split('\n')) {
        const line = raw.split('#')[0]!.trim()
        const [field, ...rest] = line.split(':')
        const value = rest.join(':').trim()
        if (/^user-agent$/i.test(field ?? '')) applies = value === '*'
        else if (applies && /^disallow$/i.test(field ?? '') && value) disallow.push(value)
      }
    }
  } catch {
    disallow = []
  }
  robotsCache.set(origin, { at: Date.now(), disallow })
  return disallow
}

export async function robotsAllows(url: string) {
  const { origin, pathname } = new URL(url)
  return !(await disallowedPaths(origin)).some(prefix => pathname.startsWith(prefix))
}

export async function politeFetch(url: string, init: RequestInit = {}, timeoutMs = 10_000) {
  const { host } = new URL(url)
  if (!(await robotsAllows(url))) throw new Error(`robots.txt van ${host} staat dit niet toe`)

  const wait = (lastHit.get(host) ?? 0) + MIN_INTERVAL_MS - Date.now()
  if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait))
  lastHit.set(host, Date.now())

  return fetch(url, {
    ...init,
    headers: { 'user-agent': USER_AGENT, ...init.headers },
    signal: AbortSignal.timeout(timeoutMs)
  })
}
