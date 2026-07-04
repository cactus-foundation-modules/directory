import { connection } from 'next/server'
import { getPublishedMapPins } from '@/modules/directory/lib/db'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import PublicMap from '@/modules/directory/components/public/PublicMap'

// categoryId is injected by the category page (lib/inject-category-context.ts)
export type DirectoryCategoryMapProps = { categoryId?: string }

export function DirectoryCategoryMap() {
  return <div style={{ height: 320, background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export async function DirectoryCategoryMapRsc(props: DirectoryCategoryMapProps) {
  await connection()
  if (!props.categoryId) return null
  const [pins, settings] = await Promise.all([
    getPublishedMapPins(props.categoryId),
    getDirectorySettings(),
  ])
  if (pins.length === 0) return null
  return <PublicMap entries={pins} zoom={settings.mapZoom} centre={[settings.mapCentreLat, settings.mapCentreLng]} collapsible />
}

export const directoryCategoryMapPuckComponent = {
  label: 'Directory: Category Map',
  fields: {},
  defaultProps: {},
  render: DirectoryCategoryMap,
}

export const directoryCategoryMapPuckRscComponent = { ...directoryCategoryMapPuckComponent, render: DirectoryCategoryMapRsc }
