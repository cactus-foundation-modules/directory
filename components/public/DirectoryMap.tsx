'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'
import 'leaflet.markercluster/dist/MarkerCluster.css'
import 'leaflet.markercluster/dist/MarkerCluster.Default.css'
import type { DirectoryMapPin } from '@/modules/directory/lib/types'

type Props = {
  entries: DirectoryMapPin[]
  categoryColours?: Record<string, string>
  zoom?: number
  centre?: [number, number]
  singlePin?: boolean
  collapsible?: boolean
}

function pinColour(pin: DirectoryMapPin, categoryColours?: Record<string, string>): string {
  return categoryColours?.[pin.categorySlug] ?? 'var(--color-primary)'
}

export default function DirectoryMap({ entries, categoryColours, zoom = 11, centre = [51.505, -0.09], singlePin = false, collapsible = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(
    collapsible && typeof window !== 'undefined' && window.innerWidth < 768
  )

  useEffect(() => {
    if (collapsed || !containerRef.current) return
    let cancelled = false
    let map: any

    Promise.all([import('leaflet'), import('leaflet.markercluster')]).then(([leafletModule]) => {
      if (cancelled || !containerRef.current) return
      const L = leafletModule.default ?? leafletModule

      const mapCentre: [number, number] = singlePin && entries[0] ? [entries[0].lat, entries[0].lng] : centre
      const mapZoom = singlePin ? Math.max(zoom, 14) : zoom

      map = L.map(containerRef.current).setView(mapCentre, mapZoom)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map)

      function buildIcon(pin: DirectoryMapPin) {
        const size = pin.featured ? 28 : 20
        return L.divIcon({
          className: 'dir-map-pin',
          html: `<span style="display:block;width:${size}px;height:${size}px;border-radius:50%;background:${pinColour(pin, categoryColours)};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
      }

      const markers = entries.map((pin) => {
        const marker = L.marker([pin.lat, pin.lng], { icon: buildIcon(pin) })
        if (!singlePin) {
          const description = pin.shortDescription ? pin.shortDescription.slice(0, 100) : ''
          marker.bindPopup(
            `<strong>${pin.name}</strong>${description ? `<br>${description}` : ''}<br><a href="/directory/${pin.categorySlug}/${pin.slug}">View listing</a>`
          )
        }
        return marker
      })

      if (singlePin) {
        markers.forEach((m) => m.addTo(map))
      } else if (markers.length > 0) {
        const clusterGroup = (L as any).markerClusterGroup()
        markers.forEach((m) => clusterGroup.addLayer(m))
        map.addLayer(clusterGroup)
      }
    })

    return () => {
      cancelled = true
      if (map) map.remove()
    }
  }, [collapsed, entries, categoryColours, zoom, centre, singlePin])

  if (collapsible && collapsed) {
    return (
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => setCollapsed(false)}>
        Show map
      </button>
    )
  }

  return (
    <div>
      {collapsible && (
        <button type="button" className="btn btn-secondary btn-sm" style={{ marginBottom: '0.5rem' }} onClick={() => setCollapsed(true)}>
          Hide map
        </button>
      )}
      <div ref={containerRef} style={{ height: singlePin ? 240 : 420, width: '100%', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }} />
    </div>
  )
}
