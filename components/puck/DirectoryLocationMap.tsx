import { connection } from 'next/server'
import { getEntryForPublic } from '@/modules/directory/lib/db'
import EntryLocationMap from '@/modules/directory/components/public/EntryLocationMap'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'

// categorySlug/entrySlug are injected by the entry page (lib/inject-entry-context.ts)
export type DirectoryLocationMapProps = { categorySlug?: string; entrySlug?: string }

export function DirectoryLocationMap() {
  return <div style={{ height: 240, background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export async function DirectoryLocationMapRsc(props: DirectoryLocationMapProps) {
  await connection()
  if (!props.categorySlug || !props.entrySlug) return null
  const entry = await getEntryForPublic(props.categorySlug, props.entrySlug)
  if (!entry) return null

  const hasLocation = !!(entry.address || entry.area || entry.subArea || (entry.lat !== null && entry.lng !== null))
  if (!hasLocation) return null

  const directionsUrl = entry.lat !== null && entry.lng !== null
    ? `https://www.google.com/maps/dir/?api=1&destination=${entry.lat},${entry.lng}`
    : entry.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(entry.address)}`
      : null

  return (
    <div className="dir-location">
      <DirectoryStyles />
      <h3 style={{ marginTop: 0 }}>Location</h3>
      {entry.address && <div>{entry.address}</div>}
      {(entry.area || entry.subArea) && <div>{[entry.area, entry.subArea].filter(Boolean).join(', ')}</div>}
      {entry.routeMarker !== null && <div className="coords">Route marker: {entry.routeMarker}</div>}
      {entry.lat !== null && entry.lng !== null && (
        <div style={{ margin: '0.5rem 0' }}>
          <EntryLocationMap lat={entry.lat} lng={entry.lng} name={entry.name} />
        </div>
      )}
      {directionsUrl && (
        <a href={directionsUrl} rel="noopener" target="_blank" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
          Get directions ↗
        </a>
      )}
    </div>
  )
}

export const directoryLocationMapPuckComponent = {
  label: 'Directory: Location Map',
  fields: {},
  defaultProps: {},
  render: DirectoryLocationMap,
}

export const directoryLocationMapPuckRscComponent = { ...directoryLocationMapPuckComponent, render: DirectoryLocationMapRsc }
