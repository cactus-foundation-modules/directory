'use client'

import { useState, useEffect } from 'react'

type MediaItem = { id: string; url: string; key: string; altText: string | null; mimeType: string }

function MultiMediaPickerModal({ alreadySelected, onAdd, onClose }: {
  alreadySelected: string[]
  onAdd: (ids: string[]) => void
  onClose: () => void
}) {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/admin/media?perPage=50')
      .then((r) => r.json())
      .then((d) => { setItems(d.items ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = query
    ? items.filter((i) => i.key.toLowerCase().includes(query.toLowerCase()) || (i.altText ?? '').toLowerCase().includes(query.toLowerCase()))
    : items

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'var(--color-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: 'var(--color-surface)', borderRadius: 8, width: '90vw', maxWidth: 800, maxHeight: '80vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0,0,0,.25)' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, flexShrink: 0 }}>Select images</h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            autoFocus
            style={{ flex: 1, padding: '0.375rem 0.75rem', border: '1px solid var(--color-border)', borderRadius: 6, fontSize: '0.875rem', fontFamily: 'inherit', background: 'var(--color-bg)', color: 'var(--color-text)' }}
          />
          <button type="button" aria-label="Close" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: 'var(--color-text-muted)', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
        <div style={{ padding: '1rem', overflowY: 'auto', flex: 1 }}>
          {loading && <p style={{ color: 'var(--color-text-muted)', textAlign: 'center' }}>Loading…</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {filtered.filter((i) => i.mimeType.startsWith('image/')).map((item) => {
              const already = alreadySelected.includes(item.id)
              const selected = picked.has(item.id)
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={already}
                  onClick={() => toggle(item.id)}
                  style={{
                    position: 'relative', border: `2px solid ${selected ? 'var(--color-primary)' : 'var(--color-border)'}`, borderRadius: 6,
                    background: 'var(--color-bg-subtle)', cursor: already ? 'not-allowed' : 'pointer', padding: 0, overflow: 'hidden', textAlign: 'left',
                    opacity: already ? 0.4 : 1,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.url} alt={item.altText ?? ''} style={{ width: '100%', height: 100, objectFit: 'cover', display: 'block' }} />
                  <div style={{ padding: '0.375rem 0.5rem', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--color-text-secondary)' }}>
                    {item.key.split('/').pop()}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary btn-sm" disabled={picked.size === 0} onClick={() => onAdd([...picked])}>
            Add {picked.size > 0 ? picked.size : ''} image{picked.size === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function EntryImagesField({ value, onChange }: { value: string[]; onChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [previews, setPreviews] = useState<Record<string, string>>({})
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  useEffect(() => {
    const missing = value.filter((id) => !previews[id])
    if (missing.length === 0) return
    Promise.all(missing.map((id) => fetch(`/api/admin/media?id=${id}`).then((r) => (r.ok ? r.json() : null)))).then((results) => {
      setPreviews((prev) => {
        const next = { ...prev }
        results.forEach((d, i) => {
          const mediaId = missing[i]
          if (mediaId && d?.items?.[0]) next[mediaId] = d.items[0].url
        })
        return next
      })
    })
  }, [value, previews])

  function handleAdd(ids: string[]) {
    onChange([...value, ...ids.filter((id) => !value.includes(id))])
    setOpen(false)
  }

  function remove(id: string) {
    onChange(value.filter((v) => v !== id))
  }

  function onDrop(index: number) {
    if (dragIndex === null || dragIndex === index) return
    const next = [...value]
    const [moved] = next.splice(dragIndex, 1)
    if (!moved) return
    next.splice(index, 0, moved)
    onChange(next)
    setDragIndex(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
        {value.map((id, index) => (
          <div
            key={id}
            draggable
            onDragStart={() => setDragIndex(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(index)}
            style={{ position: 'relative', width: 100, cursor: 'grab' }}
          >
            {previews[id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previews[id]} alt="" style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--color-border)', display: 'block' }} />
            ) : (
              <div style={{ width: 100, height: 100, background: 'var(--color-bg-subtle)', borderRadius: 6 }} />
            )}
            {index === 0 && <span className="badge badge-primary" style={{ position: 'absolute', top: 4, left: 4 }}>Cover</span>}
            <button
              type="button"
              onClick={() => remove(id)}
              aria-label="Remove image"
              style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(true)}>Add images</button>
      {open && <MultiMediaPickerModal alreadySelected={value} onAdd={handleAdd} onClose={() => setOpen(false)} />}
    </div>
  )
}
