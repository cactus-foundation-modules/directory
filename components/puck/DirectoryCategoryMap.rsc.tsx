import { connection } from 'next/server'
import { getPublishedMapPins } from '@/modules/directory/lib/db'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import { getDirectoryBreakpoints } from '@/modules/directory/lib/breakpoints'
import PublicMap from '@/modules/directory/components/public/PublicMap'
import { directoryCategoryMapPuckComponent, type DirectoryCategoryMapProps } from './DirectoryCategoryMap'

export async function DirectoryCategoryMapRsc(props: DirectoryCategoryMapProps) {
  await connection()
  if (!props.categoryId) return null
  const [pins, settings, { mobileBp }] = await Promise.all([
    getPublishedMapPins(props.categoryId),
    getDirectorySettings(),
    getDirectoryBreakpoints(),
  ])
  if (pins.length === 0) return null
  return <PublicMap entries={pins} zoom={settings.mapZoom} centre={[settings.mapCentreLat, settings.mapCentreLng]} collapsible mobileBreakpointPx={parseInt(mobileBp, 10) || 640} />
}

export const directoryCategoryMapPuckRscComponent = { ...directoryCategoryMapPuckComponent, render: DirectoryCategoryMapRsc }
