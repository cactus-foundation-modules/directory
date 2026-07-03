import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Render } from '@puckeditor/core/rsc'
import { getEntryByPreviewTokenHash } from '@/modules/directory/lib/db'
import { hashPreviewToken } from '@/modules/directory/lib/preview'
import { getMediaUrls } from '@/modules/directory/lib/media'
import { descriptionRscConfig } from '@/modules/directory/components/puck/descriptionRscConfig'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'
import EntryLocationMap from '@/modules/directory/components/public/EntryLocationMap'

type Props = { params: Promise<{ token: string }> }

export async function generateMetadata(): Promise<Metadata> {
  return { robots: { index: false, follow: false } }
}

export default async function DirectoryPreviewPage({ params }: Props) {
  const { token } = await params
  const entry = await getEntryByPreviewTokenHash(hashPreviewToken(token))
  if (!entry) notFound()

  const imageUrls = await getMediaUrls(entry.images)
  const gallery = entry.images.map((id) => imageUrls.get(id)).filter((url): url is string => !!url)

  return (
    <div className="dir-container">
      <DirectoryStyles />
      <div style={{ margin: '0 0 1.5rem', borderRadius: 6, padding: '0.75rem 1.5rem', textAlign: 'center', background: 'var(--color-warning-bg)', color: 'var(--color-warning)', fontSize: '0.875rem', fontWeight: 500 }}>
        Draft preview - not visible to the public
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span className="badge badge-gray">{entry.categoryName}</span>
      </div>
      <h1>{entry.name}</h1>

      {gallery.length > 0 && (
        <div className="dir-gallery">
          {gallery.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={url} src={url} alt="" />
          ))}
        </div>
      )}

      {entry.shortDescription && <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)' }}>{entry.shortDescription}</p>}
      {entry.description && <Render config={descriptionRscConfig} data={entry.description as any} />}

      {entry.lat !== null && entry.lng !== null && (
        <div className="dir-location">
          <EntryLocationMap lat={entry.lat} lng={entry.lng} name={entry.name} />
        </div>
      )}
    </div>
  )
}
