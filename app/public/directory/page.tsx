import type { Metadata } from 'next'
import { listCategoriesWithCounts, getPublishedCategoryCounts, getPublishedEntries, getPublishedMapPins } from '@/modules/directory/lib/db'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import { getCoverUrls } from '@/modules/directory/lib/media'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'
import CategoryGrid from '@/modules/directory/components/public/CategoryGrid'
import EntryCard from '@/modules/directory/components/public/EntryCard'
import PublicMap from '@/modules/directory/components/public/PublicMap'

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

function getPage(sp: Record<string, string | string[] | undefined>): number {
  const raw = sp.page
  const val = Array.isArray(raw) ? raw[0] : raw
  return Math.max(1, parseInt(val ?? '1', 10) || 1)
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getDirectorySettings()
  return { title: 'Directory', description: settings.introText ?? undefined }
}

export default async function DirectoryIndexPage({ searchParams }: Props) {
  const sp = await searchParams
  const page = getPage(sp)
  const perPage = 24

  const [settings, categories, categoryCounts, { entries, total }, pins] = await Promise.all([
    getDirectorySettings(),
    listCategoriesWithCounts(),
    getPublishedCategoryCounts(),
    getPublishedEntries({ page, perPage }),
    getPublishedMapPins(),
  ])

  const categoriesWithPublished = categories
    .map((c) => ({ ...c, publishedCount: categoryCounts.get(c.id) ?? 0 }))
    .filter((c) => c.publishedCount > 0)

  const coverUrls = await getCoverUrls(entries.map((e) => e.images[0] ?? null))
  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div className="dir-wide">
      <DirectoryStyles />
      <h1>Directory</h1>
      {settings.introText && <p style={{ color: 'var(--color-text-muted)' }}>{settings.introText}</p>}

      <CategoryGrid categories={categoriesWithPublished} />

      {pins.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <PublicMap entries={pins} zoom={settings.mapZoom} centre={[settings.mapCentreLat, settings.mapCentreLng]} />
        </div>
      )}

      {entries.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>Nothing listed yet.</p>
      ) : (
        <>
          <h2 className="dir-section-heading">All listings</h2>
          <p className="dir-result-count">{total} {total === 1 ? 'listing' : 'listings'}</p>
          <div className="dir-entry-grid">
            {entries.map((entry) => (
              <EntryCard key={entry.id} entry={entry} coverUrl={coverUrls.get(entry.images[0] ?? '') ?? null} featuredLabel={settings.featuredLabel} />
            ))}
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="dir-pagination">
          {page > 1 && <a href={`/directory?page=${page - 1}`}>Previous</a>}
          <span>Page {page} of {totalPages}</span>
          {page < totalPages && <a href={`/directory?page=${page + 1}`}>Next</a>}
        </div>
      )}
    </div>
  )
}
