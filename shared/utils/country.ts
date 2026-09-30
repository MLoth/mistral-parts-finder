/** Country names (Dutch, English, German) and codes that show up in listing locations. */
const COUNTRIES: Record<string, string[]> = {
  nl: ['nederland', 'netherlands', 'holland', 'niederlande'],
  be: ['belgie', 'belgium', 'belgien'],
  de: ['duitsland', 'germany', 'deutschland'],
  fr: ['frankrijk', 'france', 'frankreich'],
  gb: ['verenigd koninkrijk', 'united kingdom', 'great britain', 'engeland', 'england', 'schotland', 'scotland', 'wales', 'vereinigtes konigreich', 'uk'],
  ie: ['ierland', 'ireland', 'irland'],
  it: ['italie', 'italy', 'italien'],
  es: ['spanje', 'spain', 'spanien'],
  pt: ['portugal'],
  at: ['oostenrijk', 'austria', 'osterreich'],
  ch: ['zwitserland', 'switzerland', 'schweiz'],
  lu: ['luxemburg', 'luxembourg'],
  dk: ['denemarken', 'denmark', 'danemark', 'danmark'],
  se: ['zweden', 'sweden', 'schweden', 'sverige'],
  no: ['noorwegen', 'norway', 'norwegen', 'norge'],
  fi: ['finland', 'finnland'],
  pl: ['polen', 'poland', 'polska'],
  cz: ['tsjechie', 'czech republic', 'czechia', 'tschechien'],
  us: ['verenigde staten', 'united states', 'usa', 'vereinigte staaten'],
  ca: ['canada', 'kanada'],
  jp: ['japan'],
  au: ['australie', 'australia', 'australien']
}

const strip = (text: string) => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Best-effort country code for a free-text location like "Gent, België". Null when unknown. */
export function countryCodeFrom(location: string | undefined | null): string | null {
  if (!location) return null
  const text = ` ${strip(location).replace(/[^a-z ]/g, ' ')} `
  // A bare two-letter code, e.g. "NL"
  const bare = text.trim()
  if (bare.length === 2 && bare in COUNTRIES) return bare
  for (const [code, names] of Object.entries(COUNTRIES)) {
    if (names.some(name => text.includes(` ${name} `))) return code
  }
  return null
}
