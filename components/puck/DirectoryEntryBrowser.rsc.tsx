import { connection } from 'next/server'
import {
  getPublishedEntriesForCategory, getDistinctAreasForCategory, categoryHasRouteMarkers,
} from '@/modules/directory/lib/db'
import { getCoverUrls } from '@/modules/directory/lib/media'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import EntryFilters from '@/modules/directory/components/public/EntryFilters'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'
import type { CategorySort } from '@/modules/directory/lib/db'
import { directoryEntryBrowserPuckComponent, type DirectoryEntryBrowserProps } from './DirectoryEntryBrowser'

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

export const directoryEntryBrowserPuckRscComponent = { ...directoryEntryBrowserPuckComponent, render: DirectoryEntryBrowserRsc }
