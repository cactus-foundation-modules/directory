'use client'

import dynamic from 'next/dynamic'

const DirectoryMap = dynamic(() => import('./DirectoryMap'), { ssr: false })

export default function EntryLocationMap({ lat, lng, name }: { lat: number; lng: number; name: string }) {
  return (
    <DirectoryMap
      entries={[{ id: 'entry', name, slug: '', categoryName: '', categorySlug: '', shortDescription: null, lat, lng, featured: false }]}
      singlePin
    />
  )
}
