'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import type { DirectoryCategoryWithCount } from '@/modules/directory/lib/types'
import type { DirectoryEntryListItem } from '@/modules/directory/lib/types'

const inputStyle = { padding: '0.375rem 0.625rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)' }

function statusBadge(status: string) {
  return <span className={`badge ${status === 'published' ? 'badge-success' : 'badge-muted'}`}>{status === 'published' ? 'Published' : 'Draft'}</span>
}

export default function EntriesScreen() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adminPath = useAdminPath()
  const base = `/${adminPath}/m/directory/entries`

  const [categories, setCategories] = useState<DirectoryCategoryWithCount[]>([])
  const [entries, setEntries] = useState<DirectoryEntryListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const perPage = 25
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)

  const [category, setCategory] = useState(() => searchParams.get('category') ?? '')
  const [status, setStatus] = useState('')
  const [featured, setFeatured] = useState('')
  const [missingLocation, setMissingLocation] = useState(false)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  const hasFilters = !!(category || status || featured || missingLocation || q)

  function clearFilters() {
    setCategory('')
    setStatus('')
    setFeatured('')
    setMissingLocation(false)
    setQ('')
    setDebouncedQ('')
    setPage(1)
  }

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQ(q); setPage(1) }, 300)
    return () => clearTimeout(t)
  }, [q])

  useEffect(() => {
    fetch('/api/m/directory/admin/categories').then((r) => r.json()).then((d) => setCategories(d.categories ?? []))
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), perPage: String(perPage) })
    if (category) params.set('category', category)
    if (status) params.set('status', status)
    if (featured) params.set('featured', featured)
    if (missingLocation) params.set('missingLocation', 'true')
    if (debouncedQ) params.set('q', debouncedQ)

    const res = await fetch(`/api/m/directory/admin/entries?${params.toString()}`)
    const data = await res.json()
    setEntries(data.entries ?? [])
    setTotal(data.total ?? 0)
    setLoading(false)
  }, [page, category, status, featured, missingLocation, debouncedQ])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- delegating to async helper; all setState calls are after awaits
    load()
  }, [load])

  function updateFilter<T>(setter: (value: T) => void, value: T) {
    setter(value)
    setPage(1)
  }

  function toggleAll() {
    setSelected(selected.size === entries.length ? new Set() : new Set(entries.map((e) => e.id)))
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkStatus(newStatus: 'draft' | 'published') {
    if (!selected.size) return
    setBusy(true)
    await fetch('/api/m/directory/admin/entries/bulk-status', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected], status: newStatus }),
    })
    setSelected(new Set())
    setBusy(false)
    load()
  }

  async function bulkDelete() {
    if (!selected.size) return
    if (!confirm(`Delete ${selected.size} entries? This cannot be undone.`)) return
    setBusy(true)
    await fetch('/api/m/directory/admin/entries/bulk', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [...selected] }),
    })
    setSelected(new Set())
    setBusy(false)
    load()
  }

  async function rowDuplicate(id: string) {
    const res = await fetch(`/api/m/directory/admin/entries/${id}/duplicate`, { method: 'POST' })
    const data = await res.json()
    if (data?.id) router.push(`${base}/${data.id}`)
  }

  async function rowDelete(id: string) {
    if (!confirm('Delete this entry? This cannot be undone.')) return
    await fetch(`/api/m/directory/admin/entries/${id}`, { method: 'DELETE' })
    load()
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage))

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select style={inputStyle} value={category} onChange={(e) => updateFilter(setCategory, e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select style={inputStyle} value={status} onChange={(e) => updateFilter(setStatus, e.target.value)}>
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <select style={inputStyle} value={featured} onChange={(e) => updateFilter(setFeatured, e.target.value)}>
            <option value="">Featured &amp; not</option>
            <option value="true">Featured only</option>
            <option value="false">Not featured</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
            <input type="checkbox" checked={missingLocation} onChange={(e) => updateFilter(setMissingLocation, e.target.checked)} />
            Missing location
          </label>
          <input style={inputStyle} placeholder="Search name or area…" value={q} onChange={(e) => setQ(e.target.value)} />
          {hasFilters && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>Clear filters</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Link href={`${base}/import`} className="btn btn-secondary btn-sm">Import CSV</Link>
          <Link href={`${base}/new`} className="btn btn-primary btn-sm">New entry</Link>
        </div>
      </div>

      {!loading && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', margin: '-0.5rem 0 1rem' }}>
          {total} {total === 1 ? 'entry' : 'entries'}{hasFilters ? ' matching these filters' : ''}
        </p>
      )}

      {selected.size > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--color-surface-alt)', borderRadius: '0.375rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{selected.size} selected</span>
          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => bulkStatus('published')}>Publish</button>
          <button className="btn btn-secondary btn-sm" disabled={busy} onClick={() => bulkStatus('draft')}>Unpublish</button>
          <button className="btn btn-danger btn-sm" disabled={busy} onClick={bulkDelete}>Delete</button>
        </div>
      )}

      {loading ? (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '2rem' }}></th>
                <th>Name</th>
                <th>Category</th>
                <th>Area</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan={8} style={{ padding: '0.625rem 0.75rem' }}>
                    <div className="skeleton" style={{ height: '1.25rem', width: '100%' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : entries.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
          {hasFilters ? (
            <>
              <p style={{ margin: '0 0 0.75rem' }}>No entries match these filters.</p>
              <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>Clear filters</button>
            </>
          ) : (
            <>
              <p style={{ margin: '0 0 0.75rem' }}>No entries yet.</p>
              <Link href={`${base}/new`} className="btn btn-primary btn-sm">New entry</Link>
            </>
          )}
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th style={{ width: '2rem' }}>
                  <input type="checkbox" checked={selected.size === entries.length && entries.length > 0} onChange={toggleAll} style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }} />
                </th>
                <th>Name</th>
                <th>Category</th>
                <th>Area</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Created</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => {
                const missingLoc = e.lat === null || e.lng === null
                return (
                  <tr key={e.id} onClick={() => router.push(`${base}/${e.id}`)} style={{ cursor: 'pointer' }}>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleOne(e.id)} style={{ width: '1.125rem', height: '1.125rem', cursor: 'pointer' }} />
                    </td>
                    <td>{e.name}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{e.categoryName}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      {e.area ?? '—'}
                      {missingLoc && (
                        <span title="No coordinates set" style={{ marginLeft: '0.375rem' }}>⚠️</span>
                      )}
                    </td>
                    <td>{statusBadge(e.status)}</td>
                    <td>{e.featured ? <span className="badge badge-primary">Featured</span> : '—'}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{new Date(e.createdAt).toLocaleDateString('en-GB')}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                        <Link href={`${base}/${e.id}`} className="btn btn-ghost btn-sm">Edit</Link>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => rowDuplicate(e.id)}>Duplicate</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => rowDelete(e.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
          {page > 1 && <button className="btn btn-secondary btn-sm" onClick={() => setPage(page - 1)}>Previous</button>}
          <span style={{ lineHeight: '2rem', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Page {page} of {totalPages}</span>
          {page < totalPages && <button className="btn btn-secondary btn-sm" onClick={() => setPage(page + 1)}>Next</button>}
        </div>
      )}
    </div>
  )
}
