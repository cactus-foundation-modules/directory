import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Render } from '@puckeditor/core/rsc'
import { getEntryForPublic } from '@/modules/directory/lib/db'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import { getMediaUrls } from '@/modules/directory/lib/media'
import { descriptionRscConfig } from '@/modules/directory/components/puck/descriptionRscConfig'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'
import EntryLocationMap from '@/modules/directory/components/public/EntryLocationMap'

type Props = { params: Promise<{ category: string; slug: string }> }

function siteUrl(): string {
  return process.env.SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params
  const entry = await getEntryForPublic(category, slug)
  if (!entry) return {}
  return {
    title: entry.name,
    description: entry.shortDescription ?? undefined,
    alternates: { canonical: `${siteUrl()}/directory/${entry.categorySlug}/${entry.slug}` },
  }
}

export default async function DirectoryEntryPage({ params }: Props) {
  const { category, slug } = await params
  const entry = await getEntryForPublic(category, slug)
  if (!entry) notFound()

  const [settings, imageUrls] = await Promise.all([
    getDirectorySettings(),
    getMediaUrls(entry.images),
  ])

  const gallery = entry.images.map((id) => imageUrls.get(id)).filter((url): url is string => !!url)
  const hasContact = !!(entry.phone || entry.email || entry.website)
  const hasLocation = !!(entry.address || entry.area || entry.subArea || (entry.lat !== null && entry.lng !== null))

  const directionsUrl = entry.lat !== null && entry.lng !== null
    ? `https://www.google.com/maps/dir/?api=1&destination=${entry.lat},${entry.lng}`
    : entry.address
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(entry.address)}`
      : null

  return (
    <div className="dir-container">
      <DirectoryStyles />
      <nav className="dir-breadcrumb" aria-label="Breadcrumb">
        <Link href="/directory">Directory</Link>
        <span>/</span>
        <Link href={`/directory/${entry.categorySlug}`}>{entry.categoryName}</Link>
        <span>/</span>
        <span>{entry.name}</span>
      </nav>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span className="badge badge-gray">{entry.categoryName}</span>
        {entry.featured && <span className="badge badge-primary">{settings.featuredLabel}</span>}
      </div>
      <h1>{entry.name}</h1>

      {gallery.length > 0 && (
        gallery.length === 1 ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gallery[0]} alt={entry.name} style={{ width: '100%', borderRadius: 'var(--radius-md, 8px)', margin: '1rem 0' }} />
        ) : (
          <div className="dir-gallery">
            {gallery.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={entry.name} />
            ))}
          </div>
        )
      )}

      {entry.shortDescription && <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)' }}>{entry.shortDescription}</p>}

      {entry.description && <Render config={descriptionRscConfig} data={entry.description as any} />}

      {hasContact && (
        <div className="dir-contact-card">
          <h3 style={{ marginTop: 0 }}>Contact</h3>
          {entry.phone && <div><a href={`tel:${entry.phone.replace(/[^+\d]/g, '')}`}>{entry.phone}</a></div>}
          {entry.email && <div><a href={`mailto:${entry.email}`}>{entry.email}</a></div>}
          {entry.website && <div><a href={entry.website} rel="noopener" target="_blank">{entry.website}</a></div>}
        </div>
      )}

      {hasLocation && (
        <div className="dir-location">
          <h3 style={{ marginTop: 0 }}>Location</h3>
          {entry.address && <div>{entry.address}</div>}
          {(entry.area || entry.subArea) && <div>{[entry.area, entry.subArea].filter(Boolean).join(', ')}</div>}
          {entry.routeMarker !== null && <div className="coords">Route marker: {entry.routeMarker}</div>}
          {entry.lat !== null && entry.lng !== null && (
            <div style={{ margin: '0.5rem 0' }}>
              <EntryLocationMap lat={entry.lat} lng={entry.lng} name={entry.name} />
            </div>
          )}
          {directionsUrl && (
            <a href={directionsUrl} rel="noopener" target="_blank" className="btn btn-secondary btn-sm" style={{ marginTop: '0.5rem' }}>
              Get directions ↗
            </a>
          )}
        </div>
      )}

      {entry.tags.length > 0 && (
        <div className="dir-tags">
          {entry.tags.map((tag) => <span key={tag} className="dir-tag-chip">{tag}</span>)}
        </div>
      )}

      <div style={{ marginTop: '2rem' }}>
        <Link href={`/directory/${entry.categorySlug}`}>← Back to {entry.categoryName}</Link>
      </div>
    </div>
  )
}
