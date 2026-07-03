'use client'

import { useState } from 'react'
import { parseCsv, serialiseCsv, rowsToObjects } from '@/modules/directory/lib/csv'

const EXPECTED_COLUMNS = ['name', 'category_slug', 'lat', 'lng', 'short_description', 'description', 'address', 'area', 'sub_area', 'route_marker', 'phone', 'email', 'website', 'tags', 'featured_until']

type ParsedRow = {
  raw: Record<string, string>
  slug: string
  errors: string[]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRows(objects: Array<Record<string, string>>, categorySlugs: Set<string>): ParsedRow[] {
  const seenSlugs = new Set<string>()

  return objects.map((raw) => {
    const errors: string[] = []
    const slug = (raw.name || '').toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-')

    if (!raw.name) errors.push('Missing name')
    if (!raw.category_slug) errors.push('Missing category_slug')
    else if (!categorySlugs.has(raw.category_slug)) errors.push(`Unknown category_slug "${raw.category_slug}"`)

    const lat = Number(raw.lat)
    if (!raw.lat || Number.isNaN(lat) || lat < -90 || lat > 90) errors.push('lat must be between -90 and 90')
    const lng = Number(raw.lng)
    if (!raw.lng || Number.isNaN(lng) || lng < -180 || lng > 180) errors.push('lng must be between -180 and 180')

    if (raw.email && !EMAIL_RE.test(raw.email)) errors.push('Invalid email')
    if (raw.website && !/^https?:\/\//.test(raw.website)) errors.push('website must start with http:// or https://')
    if (raw.featured_until && Number.isNaN(Date.parse(raw.featured_until))) errors.push('featured_until is not a parseable date')
    if (raw.route_marker && Number.isNaN(Number(raw.route_marker))) errors.push('route_marker must be a number')

    // "Slug uniqueness within file" - the server auto-suffixes clashes against
    // the DB, but two rows in the same file slugifying to the same name is
    // very likely a copy/paste mistake worth flagging before import.
    if (slug) {
      if (seenSlugs.has(slug)) errors.push('Duplicate name within this file')
      seenSlugs.add(slug)
    }

    return { raw, slug, errors }
  })
}

export default function CsvImport({ categorySlugs }: { categorySlugs: string[] }) {
  const [rows, setRows] = useState<ParsedRow[] | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: Array<{ row: number; error: string }> } | null>(null)

  const categorySlugSet = new Set(categorySlugs)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const parsed = parseCsv(text)
      const objects = rowsToObjects(parsed)
      setRows(validateRows(objects, categorySlugSet))
      setResult(null)
    }
    reader.readAsText(file)
  }

  const readyRows = rows?.filter((r) => r.errors.length === 0) ?? []
  const errorRows = rows?.filter((r) => r.errors.length > 0) ?? []

  async function runImport() {
    setImporting(true)
    const payload = readyRows.map((r) => ({
      name: r.raw.name,
      categorySlug: r.raw.category_slug,
      lat: Number(r.raw.lat),
      lng: Number(r.raw.lng),
      shortDescription: r.raw.short_description || null,
      description: r.raw.description || null,
      address: r.raw.address || null,
      area: r.raw.area || null,
      subArea: r.raw.sub_area || null,
      routeMarker: r.raw.route_marker ? Number(r.raw.route_marker) : null,
      phone: r.raw.phone || null,
      email: r.raw.email || null,
      website: r.raw.website || null,
      tags: r.raw.tags ? r.raw.tags.split('|').map((t) => t.trim()).filter(Boolean) : [],
      featuredUntil: r.raw.featured_until ? new Date(r.raw.featured_until).toISOString() : null,
    }))

    const res = await fetch('/api/m/directory/admin/entries/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows: payload }),
    })
    const data = await res.json()
    setResult(data)
    setImporting(false)
  }

  function downloadErrorReport() {
    if (!rows) return
    const errorObjects = rows.filter((r) => r.errors.length > 0)
    const header = [...EXPECTED_COLUMNS, 'errors']
    const csvRows = [header, ...errorObjects.map((r) => [...EXPECTED_COLUMNS.map((c) => r.raw[c] ?? ''), r.errors.join('; ')])]
    const blob = new Blob([serialiseCsv(csvRows)], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'directory-import-errors.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
        Columns: {EXPECTED_COLUMNS.join(', ')}. Only <code>name</code>, <code>category_slug</code>, <code>lat</code> and <code>lng</code> are required.
        Separate multiple <code>tags</code> with a pipe (|). Everything imports as a draft.
      </p>

      <input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {rows && !result && (
        <div style={{ marginTop: '1rem' }}>
          <p style={{ fontSize: '0.875rem' }}>{readyRows.length} ready to import, {errorRows.length} with errors.</p>

          <div className="table-wrapper" style={{ maxHeight: 320, overflowY: 'auto' }}>
            <table className="table">
              <thead><tr><th>Name</th><th>Category</th><th>Lat/Lng</th><th>Status</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.raw.name || '—'}</td>
                    <td>{r.raw.category_slug || '—'}</td>
                    <td>{r.raw.lat}, {r.raw.lng}</td>
                    <td>
                      {r.errors.length === 0
                        ? <span className="badge badge-success">Ready</span>
                        : <span className="badge badge-danger" title={r.errors.join('; ')}>{r.errors[0]}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button className="btn btn-primary btn-sm" disabled={readyRows.length === 0 || importing} onClick={runImport}>
              {importing ? 'Importing…' : `Import ${readyRows.length} entries`}
            </button>
            {errorRows.length > 0 && (
              <button className="btn btn-secondary btn-sm" onClick={downloadErrorReport}>Download error report</button>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className="alert alert-success" style={{ marginTop: '1rem' }}>
          Imported {result.imported} {result.imported === 1 ? 'entry' : 'entries'} as drafts.
          {result.errors.length > 0 && ` ${result.errors.length} rows were skipped.`}
        </div>
      )}
    </div>
  )
}
