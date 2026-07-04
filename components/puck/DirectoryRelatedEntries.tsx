import { connection } from 'next/server'
import Link from 'next/link'
import { getEntryForPublic, getPublishedEntriesForCategory } from '@/modules/directory/lib/db'
import { getCoverUrls } from '@/modules/directory/lib/media'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import EntryCard from '@/modules/directory/components/public/EntryCard'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'

// categorySlug/entrySlug are injected by the entry page (lib/inject-entry-context.ts)
export type DirectoryRelatedEntriesProps = { categorySlug?: string; entrySlug?: string }

const RELATED_LIMIT = 3

export function DirectoryRelatedEntries() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', opacity: 0.6 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 160, background: 'var(--color-border)', borderRadius: 8 }} />
      ))}
    </div>
  )
}

export async function DirectoryRelatedEntriesRsc(props: DirectoryRelatedEntriesProps) {
  await connection()
  if (!props.categorySlug || !props.entrySlug) return null
  const entry = await getEntryForPublic(props.categorySlug, props.entrySlug)
  if (!entry) return null

  const [siblings, settings] = await Promise.all([
    getPublishedEntriesForCategory(entry.categoryId),
    getDirectorySettings(),
  ])
  const related = siblings.filter((e) => e.id !== entry.id).slice(0, RELATED_LIMIT)
  if (related.length === 0) return null

  const coverUrlMap = await getCoverUrls(related.map((e) => e.images[0] ?? null))

  return (
    <div>
      <DirectoryStyles />
      <h3 style={{ marginTop: 0 }}>More in {entry.categoryName}</h3>
      <div className="dir-entry-grid">
        {related.map((e) => (
          <EntryCard key={e.id} entry={e} coverUrl={coverUrlMap.get(e.images[0] ?? '') ?? null} featuredLabel={settings.featuredLabel} />
        ))}
      </div>
      <Link href={`/directory/${entry.categorySlug}`}>See all in {entry.categoryName} →</Link>
    </div>
  )
}

export const directoryRelatedEntriesPuckComponent = {
  label: 'Directory: Related Entries',
  fields: {},
  defaultProps: {},
  render: DirectoryRelatedEntries,
}

export const directoryRelatedEntriesPuckRscComponent = { ...directoryRelatedEntriesPuckComponent, render: DirectoryRelatedEntriesRsc }
