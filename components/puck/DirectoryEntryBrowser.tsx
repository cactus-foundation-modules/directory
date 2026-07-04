import { connection } from 'next/server'
import {
  getPublishedEntriesForCategory, getDistinctAreasForCategory, categoryHasRouteMarkers,
} from '@/modules/directory/lib/db'
import { getCoverUrls } from '@/modules/directory/lib/media'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import EntryFilters from '@/modules/directory/components/public/EntryFilters'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'
import type { CategorySort } from '@/modules/directory/lib/db'

// [ANCHOR] - categoryId/categorySlug/area/sort are injected by the category
// page (lib/inject-category-context.ts). viewMode/pageSize are the only
// author-configurable fields.
export type DirectoryEntryBrowserProps = {
  categorySlug?: string
  categoryId?: string
  area?: string
  sort?: string
  pageSize?: number
}

export function DirectoryEntryBrowser() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', opacity: 0.6 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 180, background: 'var(--color-border)', borderRadius: 8 }} />
      ))}
    </div>
  )
}

export async function DirectoryEntryBrowserRsc(props: DirectoryEntryBrowserProps) {
  await connection()
  if (!props.categoryId || !props.categorySlug) return null

  const [entries, areas, routeMarkerAvailable, settings] = await Promise.all([
    getPublishedEntriesForCategory(props.categoryId, { area: props.area, sort: props.sort as CategorySort | undefined }),
    getDistinctAreasForCategory(props.categoryId),
    categoryHasRouteMarkers(props.categoryId),
    getDirectorySettings(),
  ])

  const pageSize = props.pageSize && props.pageSize > 0 ? props.pageSize : undefined
  const visible = pageSize ? entries.slice(0, pageSize) : entries
  const coverUrlMap = await getCoverUrls(visible.map((e) => e.images[0] ?? null))
  const coverUrls = Object.fromEntries(coverUrlMap)

  return (
    <>
      <DirectoryStyles />
      <EntryFilters
        entries={visible}
        coverUrls={coverUrls}
        areas={areas}
        currentArea={props.area ?? ''}
        sort={props.sort ?? 'newest'}
        routeMarkerAvailable={routeMarkerAvailable}
        featuredLabel={settings.featuredLabel}
        categorySlug={props.categorySlug}
      />
    </>
  )
}

export const directoryEntryBrowserPuckComponent = {
  label: 'Directory: Entry Browser [Anchor]',
  fields: {
    pageSize: { type: 'number' as const, label: 'Max entries shown (blank = all)' },
  },
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: DirectoryEntryBrowser,
}

export const directoryEntryBrowserPuckRscComponent = { ...directoryEntryBrowserPuckComponent, render: DirectoryEntryBrowserRsc }
