'use client'

import dynamic from 'next/dynamic'

const DirectoryMap = dynamic(() => import('@/modules/directory/components/public/DirectoryMap'), { ssr: false })

export default function EntryMapPreview({ lat, lng, name }: { lat: number | null; lng: number | null; name: string }) {
  if (lat === null || lng === null) {
    return (
      <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
        No coordinates yet
      </div>
    )
  }

  return (
    <DirectoryMap
      entries={[{ id: 'preview', name, slug: '', categoryName: '', categorySlug: '', shortDescription: null, lat, lng, featured: false }]}
      singlePin
    />
  )
}
