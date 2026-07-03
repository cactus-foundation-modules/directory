import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  getCategoryBySlug, getPublishedEntriesForCategory, getDistinctAreasForCategory,
  categoryHasRouteMarkers, getPublishedMapPins,
} from '@/modules/directory/lib/db'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import { getCoverUrls } from '@/modules/directory/lib/media'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'
import EntryFilters from '@/modules/directory/components/public/EntryFilters'
import PublicMap from '@/modules/directory/components/public/PublicMap'
import type { CategorySort } from '@/modules/directory/lib/db'

type Props = {
  params: Promise<{ category: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug } = await params
  const category = await getCategoryBySlug(categorySlug)
  if (!category) return {}
  return { title: category.name, description: category.description ?? undefined }
}

export default async function DirectoryCategoryPage({ params, searchParams }: Props) {
  const { category: categorySlug } = await params
  const sp = await searchParams
  const area = first(sp.area)
  const sort = (first(sp.sort) || 'newest') as CategorySort

  const category = await getCategoryBySlug(categorySlug)
  if (!category) notFound()

  const [settings, allPublished, areas, routeMarkerAvailable] = await Promise.all([
    getDirectorySettings(),
    getPublishedEntriesForCategory(category.id),
    getDistinctAreasForCategory(category.id),
    categoryHasRouteMarkers(category.id),
  ])

  if (allPublished.length === 0) notFound()

  const entries = area ? await getPublishedEntriesForCategory(category.id, { area, sort }) : await getPublishedEntriesForCategory(category.id, { sort })
  const pins = await getPublishedMapPins(category.id)
  const coverUrlMap = await getCoverUrls(entries.map((e) => e.images[0] ?? null))
  const coverUrls = Object.fromEntries(coverUrlMap)

  return (
    <div className="dir-wide">
      <DirectoryStyles />
      <h1>{category.icon ? `${category.icon} ` : ''}{category.name}</h1>
      {category.description && <p style={{ color: 'var(--color-text-muted)' }}>{category.description}</p>}

      {pins.length > 0 && (
        <div style={{ marginBottom: '1.5rem' }}>
          <PublicMap entries={pins} zoom={settings.mapZoom} centre={[settings.mapCentreLat, settings.mapCentreLng]} collapsible />
        </div>
      )}

      <EntryFilters
        entries={entries}
        coverUrls={coverUrls}
        areas={areas}
        currentArea={area}
        sort={sort}
        routeMarkerAvailable={routeMarkerAvailable}
        featuredLabel={settings.featuredLabel}
        categorySlug={categorySlug}
      />
    </div>
  )
}
