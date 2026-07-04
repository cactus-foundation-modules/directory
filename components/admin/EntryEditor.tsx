'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Puck } from '@puckeditor/core'
import type { Data } from '@puckeditor/core'
import '@puckeditor/core/no-external.css'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import { useUnsavedChanges } from '@/components/admin/useUnsavedChanges'
import { UnsavedChangesModal } from '@/components/admin/UnsavedChangesModal'
import { descriptionEditorConfig } from '@/modules/directory/components/puck/descriptionEditorConfig'
import DirectoryNav from './DirectoryNav'
import EntryImagesField from './EntryImagesField'
import GeocodeLookup from './GeocodeLookup'
import EntryMapPreview from './EntryMapPreview'
import type { DirectoryCategoryWithCount, DirectoryEntryWithCategory, PuckData } from '@/modules/directory/lib/types'

const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.875rem' }
const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 100)
}

function toDateInputValue(date: Date | string | null): string {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().slice(0, 10)
}

type Props = { entry: DirectoryEntryWithCategory | null; categories: DirectoryCategoryWithCount[] }

export default function EntryEditor({ entry, categories }: Props) {
  const router = useRouter()
  const adminPath = useAdminPath()
  const base = `/${adminPath}/m/directory/entries`
  const { dirtyRef, pendingHref, setPendingHref } = useUnsavedChanges()

  const [id, setId] = useState<string | null>(entry?.id ?? null)
  const [categoryId, setCategoryId] = useState(entry?.categoryId ?? categories[0]?.id ?? '')
  const [name, setName] = useState(entry?.name ?? '')
  const [slug, setSlug] = useState(entry?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(!!entry)
  const [shortDescription, setShortDescription] = useState(entry?.shortDescription ?? '')
  const [description, setDescription] = useState<PuckData>(entry?.description ?? { root: { props: {} }, content: [], zones: {} })
  const [status, setStatus] = useState<'draft' | 'published'>(entry?.status ?? 'draft')
  const [featured, setFeatured] = useState(entry?.featured ?? false)
  const [featuredUntil, setFeaturedUntil] = useState(toDateInputValue(entry?.featuredUntil ?? null))
  const [address, setAddress] = useState(entry?.address ?? '')
  const [lat, setLat] = useState<string>(entry?.lat !== null && entry?.lat !== undefined ? String(entry.lat) : '')
  const [lng, setLng] = useState<string>(entry?.lng !== null && entry?.lng !== undefined ? String(entry.lng) : '')
  const [area, setArea] = useState(entry?.area ?? '')
  const [subArea, setSubArea] = useState(entry?.subArea ?? '')
  const [routeMarker, setRouteMarker] = useState<string>(entry?.routeMarker !== null && entry?.routeMarker !== undefined ? String(entry.routeMarker) : '')
  const [phone, setPhone] = useState(entry?.phone ?? '')
  const [email, setEmail] = useState(entry?.email ?? '')
  const [website, setWebsite] = useState(entry?.website ?? '')
  const [images, setImages] = useState<string[]>(entry?.images ?? [])
  const [tags, setTags] = useState<string[]>(entry?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [allTags, setAllTags] = useState<string[]>([])

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewCopied, setPreviewCopied] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/m/directory/admin/entries/tags').then((r) => r.json()).then((d) => setAllTags(d.tags ?? []))
  }, [])

  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    dirtyRef.current = true
  }, [dirtyRef, categoryId, name, slug, shortDescription, description, status, featured, featuredUntil, address, lat, lng, area, subArea, routeMarker, phone, email, website, images, tags])

  function leaveNow(href: string) {
    dirtyRef.current = false
    setPendingHref(null)
    router.push(href)
  }

  function handleNameChange(value: string) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  function addTag() {
    const value = tagInput.trim()
    if (!value) return
    if (!tags.includes(value)) setTags([...tags, value])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag))
  }

  function buildPayload() {
    return {
      categoryId,
      name,
      slug,
      shortDescription: shortDescription || null,
      description,
      featured,
      featuredUntil: featured && featuredUntil ? new Date(featuredUntil).toISOString() : null,
      lat: lat !== '' ? Number(lat) : null,
      lng: lng !== '' ? Number(lng) : null,
      address: address || null,
      area: area || null,
      subArea: subArea || null,
      routeMarker: routeMarker !== '' ? Number(routeMarker) : null,
      phone: phone || null,
      email: email || null,
      website: website || null,
      images,
      tags,
    }
  }

  const save = async (nextStatus: 'draft' | 'published') => {
    if (!name.trim()) { setError('Name is required'); setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); return }
    if (!categoryId) { setError('Category is required - create a category first'); setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); return }

    setSaving(true)
    setError(null)
    setSaved(false)
    const payload = { ...buildPayload(), status: nextStatus }

    try {
      if (!id) {
        const res = await fetch('/api/m/directory/admin/entries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data?.error ?? 'Could not create entry'); setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); return }
        setId(data.id)
        setSlug(data.slug)
        setStatus(nextStatus)
        dirtyRef.current = false
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        router.replace(`${base}/${data.id}`)
      } else {
        const res = await fetch(`/api/m/directory/admin/entries/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) { setError(data?.error ?? 'Could not save entry'); setTimeout(() => errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); return }
        setSlug(data.slug)
        setStatus(nextStatus)
        dirtyRef.current = false
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  async function duplicate() {
    if (!id) return
    const res = await fetch(`/api/m/directory/admin/entries/${id}/duplicate`, { method: 'POST' })
    const data = await res.json()
    if (data?.id) router.push(`${base}/${data.id}`)
  }

  async function copyPreviewLink() {
    if (!id) return
    const res = await fetch(`/api/m/directory/admin/entries/${id}/preview-token`, { method: 'POST' })
    const data = await res.json()
    if (data?.token) {
      const fullUrl = `${window.location.origin}/directory/preview/${data.token}`
      setPreviewUrl(fullUrl)
      try {
        await navigator.clipboard.writeText(fullUrl)
        setPreviewCopied(true)
        setTimeout(() => setPreviewCopied(false), 2000)
      } catch { /* clipboard unavailable */ }
    }
  }

  const currentCategorySlug = categories.find((c) => c.id === categoryId)?.slug
  const liveUrl = status === 'published' && id && currentCategorySlug && slug ? `/directory/${currentCategorySlug}/${slug}` : null

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 className="page-title">{entry?.name || 'New entry'}</h1>
          <span className={`badge ${status === 'published' ? 'badge-success' : 'badge-muted'}`}>{status === 'published' ? 'Published' : 'Draft'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {saved && <span style={{ fontSize: '0.8125rem', color: 'var(--color-success, var(--color-primary))' }}>Saved ✓</span>}
          {liveUrl && (
            <a href={liveUrl} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">View live ↗</a>
          )}
          {status === 'draft' && id && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={copyPreviewLink}>{previewCopied ? 'Link copied ✓' : 'Copy preview link'}</button>
          )}
          {id && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={duplicate}>Duplicate</button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => save('draft')} disabled={saving}>Save Draft</button>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => save('published')} disabled={saving}>Publish</button>
        </div>
      </div>

      <DirectoryNav />

      {error && <div ref={errorRef} className="alert alert-danger" style={{ marginBottom: '1rem', fontSize: '0.8125rem' }}>{error}</div>}
      {previewUrl && <div style={{ marginBottom: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', wordBreak: 'break-all' }}>{previewUrl}</div>}

      <div className="directory-entry-grid-container directory-entry-layout">
        <div className="card de-core" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Core</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Name</label>
            <input style={inputStyle} value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Entry name" />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Slug</label>
            <input style={inputStyle} value={slug} onChange={(e) => { setSlugTouched(true); setSlug(e.target.value) }} />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Category</label>
            <select style={inputStyle} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.5rem' }}>
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
            Featured
          </label>
          {featured && (
            <div>
              <label style={labelStyle}>Featured until (optional)</label>
              <input type="date" style={{ ...inputStyle, maxWidth: 200 }} value={featuredUntil} onChange={(e) => setFeaturedUntil(e.target.value)} />
            </div>
          )}
        </div>

        <div className="card de-contact" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Contact</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Phone</label>
            <input style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Website</label>
            <input style={inputStyle} value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className="card de-tags" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Tags</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
            {tags.map((tag) => (
              <span key={tag} className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                {tag}
                <button type="button" onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', lineHeight: 1 }}>×</button>
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              style={inputStyle}
              list="directory-tag-suggestions"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }}
              placeholder="Add a tag…"
            />
            <datalist id="directory-tag-suggestions">
              {allTags.map((t) => <option key={t} value={t} />)}
            </datalist>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addTag}>Add</button>
          </div>
        </div>

        <div className="card de-content" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Content</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Short description</label>
            <textarea
              style={{ ...inputStyle, resize: 'vertical' }}
              rows={2}
              maxLength={160}
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
            />
            <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', textAlign: 'right' }}>{shortDescription.length}/160</div>
          </div>
          <label style={labelStyle}>Description</label>
          <div style={{ minHeight: 320, border: '1px solid var(--color-border)', borderRadius: 6, overflow: 'hidden' }}>
            <Puck
              config={descriptionEditorConfig as any}
              data={description as unknown as Data}
              onChange={(data) => setDescription(data as unknown as PuckData)}
              iframe={{ enabled: false }}
            />
          </div>
        </div>

        <div className="card de-location" style={{ minWidth: 0, padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Location</h3>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={labelStyle}>Address</label>
            <input style={inputStyle} value={address} onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <GeocodeLookup address={address} onFound={(foundLat, foundLng) => { setLat(foundLat.toFixed(6)); setLng(foundLng.toFixed(6)) }} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Latitude</label>
              <input style={inputStyle} value={lat} onChange={(e) => setLat(e.target.value)} placeholder="51.505000" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Longitude</label>
              <input style={inputStyle} value={lng} onChange={(e) => setLng(e.target.value)} placeholder="-0.090000" />
            </div>
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <EntryMapPreview lat={lat !== '' ? Number(lat) : null} lng={lng !== '' ? Number(lng) : null} name={name || 'Entry'} />
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Area</label>
              <input style={inputStyle} value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Sub-area</label>
              <input style={inputStyle} value={subArea} onChange={(e) => setSubArea(e.target.value)} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Route marker (optional)</label>
            <input style={{ ...inputStyle, maxWidth: 160 }} value={routeMarker} onChange={(e) => setRouteMarker(e.target.value)} placeholder="e.g. 3.5" />
          </div>
        </div>

        <div className="card de-media" style={{ padding: '1rem' }}>
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Media</h3>
          <EntryImagesField value={images} onChange={setImages} />
        </div>
      </div>

      <UnsavedChangesModal
        pendingHref={pendingHref}
        saving={saving}
        onCancel={() => setPendingHref(null)}
        onDiscard={() => leaveNow(pendingHref!)}
        onSave={async () => { await save(status); if (pendingHref) leaveNow(pendingHref) }}
      />
    </div>
  )
}
