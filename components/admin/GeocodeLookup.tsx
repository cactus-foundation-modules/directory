'use client'

import { useState } from 'react'

export default function GeocodeLookup({ address, onFound }: { address: string; onFound: (lat: number, lng: number) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function lookup() {
    if (!address.trim()) {
      setError('Enter an address first')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/m/directory/admin/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        setError(data?.error ?? 'Could not find that address')
        return
      }
      const data = await res.json()
      onFound(data.lat, data.lng)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <button type="button" className="btn btn-secondary btn-sm" onClick={lookup} disabled={loading}>
        {loading ? 'Looking up…' : 'Find coordinates'}
      </button>
      {error && <span style={{ fontSize: '0.8125rem', color: 'var(--color-destructive)' }}>{error}</span>}
    </div>
  )
}
