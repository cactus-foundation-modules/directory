'use client'

import { useEffect, useState } from 'react'
import type { DirectorySettings } from '@/modules/directory/lib/types'

const inputStyle = { width: '100%', maxWidth: 320, padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 6, background: 'var(--color-bg)', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.875rem' }
const labelStyle = { display: 'block', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }

export function DirectorySettingsTab() {
  const [settings, setSettings] = useState<DirectorySettings | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [introText, setIntroText] = useState('')
  const [mapCentreLat, setMapCentreLat] = useState('51.505')
  const [mapCentreLng, setMapCentreLng] = useState('-0.09')
  const [mapZoom, setMapZoom] = useState(11)
  const [featuredLabel, setFeaturedLabel] = useState('Featured')
  const [csvImportEnabled, setCsvImportEnabled] = useState(true)

  useEffect(() => {
    fetch('/api/m/directory/admin/settings').then(async (res) => {
      if (res.status === 403) { setForbidden(true); setLoading(false); return }
      const data: DirectorySettings = await res.json()
      setSettings(data)
      setIntroText(data.introText ?? '')
      setMapCentreLat(String(data.mapCentreLat))
      setMapCentreLng(String(data.mapCentreLng))
      setMapZoom(data.mapZoom)
      setFeaturedLabel(data.featuredLabel)
      setCsvImportEnabled(data.csvImportEnabled)
      setLoading(false)
    })
  }, [])

  async function save() {
    setError(null)
    const latNum = Number(mapCentreLat)
    const lngNum = Number(mapCentreLng)
    if (Number.isNaN(latNum) || latNum < -90 || latNum > 90) { setError('Map centre latitude must be between -90 and 90'); return }
    if (Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180) { setError('Map centre longitude must be between -180 and 180'); return }
    if (mapZoom < 1 || mapZoom > 18) { setError('Map zoom must be between 1 and 18'); return }

    setSaving(true)
    setSaved(false)
    await fetch('/api/m/directory/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        introText: introText || null,
        mapCentreLat: Number(mapCentreLat),
        mapCentreLng: Number(mapCentreLng),
        mapZoom,
        featuredLabel,
        csvImportEnabled,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return null
  if (forbidden || !settings) {
    return <div className="alert alert-danger">Only directory managers can view or change directory settings.</div>
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 480 }}>
      {error && <div className="alert alert-danger" style={{ fontSize: '0.8125rem' }}>{error}</div>}

      <div>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Front page</h3>
        <label style={labelStyle}>Intro text</label>
        <textarea
          style={{ ...inputStyle, resize: 'vertical' }}
          rows={3}
          value={introText}
          onChange={(e) => setIntroText(e.target.value)}
          placeholder="Shown above the category grid on the directory front page"
        />
        <div style={{ marginTop: '0.75rem' }}>
          <label style={labelStyle}>Featured label</label>
          <input style={inputStyle} value={featuredLabel} onChange={(e) => setFeaturedLabel(e.target.value)} maxLength={50} />
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>The badge shown on entries marked &quot;Featured&quot; - e.g. &quot;Featured&quot; or &quot;Sponsored&quot;.</p>
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Map</h3>
        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem' }}>Where the directory map opens by default, before it zooms to fit your entries.</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <label style={labelStyle}>Map centre latitude</label>
            <input style={inputStyle} value={mapCentreLat} onChange={(e) => setMapCentreLat(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Map centre longitude</label>
            <input style={inputStyle} value={mapCentreLng} onChange={(e) => setMapCentreLng(e.target.value)} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Default map zoom</label>
          <input type="number" min={1} max={18} style={{ ...inputStyle, maxWidth: 100 }} value={mapZoom} onChange={(e) => setMapZoom(Number(e.target.value))} />
        </div>
      </div>

      <div>
        <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.9375rem' }}>Import</h3>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem' }}>
          <input type="checkbox" checked={csvImportEnabled} onChange={(e) => setCsvImportEnabled(e.target.checked)} />
          Allow CSV import
        </label>
        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>Turn off to hide the CSV import screen from Directory managers.</p>
      </div>

      <div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}>{saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save'}</button>
      </div>
    </div>
  )
}
