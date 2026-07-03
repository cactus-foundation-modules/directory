'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import EntryCard from './EntryCard'
import type { DirectoryEntryListItem } from '@/modules/directory/lib/types'

const selectStyle = { padding: '0.375rem 0.625rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)' }

type Props = {
  entries: DirectoryEntryListItem[]
  coverUrls: Record<string, string>
  areas: string[]
  currentArea: string
  sort: string
  routeMarkerAvailable: boolean
  featuredLabel: string
  categorySlug: string
}

export default function EntryFilters({ entries, coverUrls, areas, currentArea, sort, routeMarkerAvailable, featuredLabel, categorySlug }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return entries
    const q = query.toLowerCase()
    return entries.filter((e) => e.name.toLowerCase().includes(q) || (e.shortDescription ?? '').toLowerCase().includes(q))
  }, [entries, query])

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(window.location.search)
    if (value) params.set(key, value)
    else params.delete(key)
    router.push(`/directory/${categorySlug}?${params.toString()}`)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this category…"
          style={{ ...selectStyle, flex: '1 1 200px' }}
        />
        {areas.length > 0 && (
          <select style={selectStyle} value={currentArea} onChange={(e) => updateParam('area', e.target.value)}>
            <option value="">All areas</option>
            {areas.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        )}
        <select style={selectStyle} value={sort} onChange={(e) => updateParam('sort', e.target.value)}>
          <option value="newest">Newest</option>
          <option value="alphabetical">A-Z</option>
          {routeMarkerAvailable && <option value="route_marker">Route order</option>}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No matches.</p>
      ) : (
        <div className="dir-entry-grid">
          {filtered.map((entry) => (
            <EntryCard key={entry.id} entry={entry} coverUrl={coverUrls[entry.images[0] ?? ''] ?? null} featuredLabel={featuredLabel} />
          ))}
        </div>
      )}
    </div>
  )
}
