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

    let resizeObserver: ResizeObserver | undefined
    let hintEl: HTMLDivElement | undefined
    let onWheel: ((e: WheelEvent) => void) | undefined
    let hintTimer: ReturnType<typeof setTimeout> | undefined
    let container: HTMLDivElement | undefined

    import('leaflet').then(async (leafletModule) => {
      if (cancelled || !containerRef.current) return
      const L = leafletModule.default ?? leafletModule
      // leaflet.markercluster is an old-style UMD plugin: it reads the bare
      // `L` identifier at module top-level, expecting Leaflet exposed as a
      // global (as it would be via a <script> tag). Without this it throws
      // "ReferenceError: Can't find variable: L" the instant it's imported.
      ;(window as any).L = L
      await import('leaflet.markercluster')
      if (cancelled || !containerRef.current) return
      container = containerRef.current

      const mapCentre: [number, number] = singlePin && entries[0] ? [entries[0].lat, entries[0].lng] : centre
      const mapZoom = singlePin ? Math.max(zoom, 14) : zoom

      // Wheel-zoom is off by default; a held modifier key re-enables it (see
      // wheel handler below) so scrolling the page over a map doesn't trap
      // the user's scroll.
      map = L.map(container, { scrollWheelZoom: false }).setView(mapCentre, mapZoom)
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
        // Fit every marker in view rather than the admin-configured default
        // centre/zoom, which was frequently too tight or off-centre.
        map.fitBounds(clusterGroup.getBounds(), { padding: [32, 32], maxZoom: 15 })
      }

      // The container can still be mid-layout (gallery images loading, fonts
      // swapping) when the map is created, leaving tiles unfetched outside
      // the size measured at init - shows up as a blank strip. Recompute on
      // any resize.
      resizeObserver = new ResizeObserver(() => map.invalidateSize())
      resizeObserver.observe(container)

      // Google Maps-style scroll lock: wheel only zooms while the modifier is
      // held, otherwise the page scrolls past normally and we show a hint.
      const isMac = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform || navigator.userAgent)
      hintEl = document.createElement('div')
      hintEl.textContent = isMac ? 'Use ⌘ + scroll to zoom the map' : 'Use ctrl + scroll to zoom the map'
      Object.assign(hintEl.style, {
        position: 'absolute', inset: '0', display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.45)', color: '#fff',
        fontSize: '0.875rem', fontWeight: '500', opacity: '0', transition: 'opacity 0.15s ease',
        pointerEvents: 'none', zIndex: '1000',
      } satisfies Partial<CSSStyleDeclaration>)
      container.style.position = 'relative'
      container.appendChild(hintEl)

      onWheel = (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          map.setZoom(map.getZoom() + (e.deltaY < 0 ? 1 : -1))
        } else if (hintEl) {
          hintEl.style.opacity = '1'
          clearTimeout(hintTimer)
          hintTimer = setTimeout(() => { if (hintEl) hintEl.style.opacity = '0' }, 1200)
        }
      }
      container.addEventListener('wheel', onWheel, { passive: false })
    })

    return () => {
      cancelled = true
      resizeObserver?.disconnect()
      clearTimeout(hintTimer)
      if (onWheel) container?.removeEventListener('wheel', onWheel)
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
      <div ref={containerRef} style={{ height: singlePin ? 240 : 420, width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden' }} />
    </div>
  )
}
