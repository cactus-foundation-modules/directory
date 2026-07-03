import { getSiteConfig } from '@/lib/config/site'

export type GeocodeResult = { lat: number; lng: number; displayName: string }

// Nominatim's usage policy requires a descriptive User-Agent identifying the
// application - no API key involved, just this header. One request per lookup,
// triggered manually from the entry editor (never in a loop/batch).
export async function geocodeAddress(query: string): Promise<GeocodeResult | null> {
  const siteConfig = await getSiteConfig()
  const siteName = siteConfig?.siteName || 'Cactus Site'

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')

  const res = await fetch(url.toString(), {
    headers: { 'User-Agent': `${siteName} (Cactus Directory)` },
  })
  if (!res.ok) return null

  const results = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>
  const first = results[0]
  if (!first) return null

  return { lat: parseFloat(first.lat), lng: parseFloat(first.lon), displayName: first.display_name }
}
