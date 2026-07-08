'use client'

import dynamic from 'next/dynamic'
import type { DirectoryMapPin } from '@/modules/directory/lib/types'

const DirectoryMap = dynamic(() => import('./DirectoryMap'), { ssr: false })

type Props = {
  entries: DirectoryMapPin[]
  zoom?: number
  centre?: [number, number]
  collapsible?: boolean
  mobileBreakpointPx?: number
}

// Thin client wrapper so server component pages (index/category) can render
// the Leaflet map without importing next/dynamic(ssr:false) themselves - not
// allowed directly inside a Server Component.
export default function PublicMap({ entries, zoom, centre, collapsible, mobileBreakpointPx }: Props) {
  return <DirectoryMap entries={entries} zoom={zoom} centre={centre} collapsible={collapsible} mobileBreakpointPx={mobileBreakpointPx} />
}
