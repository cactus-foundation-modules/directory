import { connection } from 'next/server'
import Link from 'next/link'
import { Render } from '@puckeditor/core/rsc'
import { getEntryForPublic } from '@/modules/directory/lib/db'
import { getMediaUrls } from '@/modules/directory/lib/media'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import { descriptionRscConfig } from '@/modules/directory/components/puck/descriptionRscConfig'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'

// [ANCHOR] - categorySlug/entrySlug are injected by the entry page (lib/inject-entry-context.ts)
export type DirectoryEntryHeaderProps = { categorySlug?: string; entrySlug?: string }

export function DirectoryEntryHeader() {
  return (
    <div style={{ opacity: 0.6 }}>
      <div style={{ height: 14, width: '30%', background: 'var(--color-border)', borderRadius: 4, marginBottom: '0.75rem' }} />
      <div style={{ height: 200, background: 'var(--color-border)', borderRadius: 8, marginBottom: '1rem' }} />
      <div style={{ height: 32, width: '50%', background: 'var(--color-border)', borderRadius: 4 }} />
    </div>
  )
}

export async function DirectoryEntryHeaderRsc(props: DirectoryEntryHeaderProps) {
  await connection()
  if (!props.categorySlug || !props.entrySlug) return null
  const entry = await getEntryForPublic(props.categorySlug, props.entrySlug)
  if (!entry) return null

  const [imageUrls, settings] = await Promise.all([
    getMediaUrls(entry.images),
    getDirectorySettings(),
  ])
  const gallery = entry.images.map((id) => imageUrls.get(id)).filter((url): url is string => !!url)

  return (
    <div>
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
      {entry.tags.length > 0 && (
        <div className="dir-tags">
          {entry.tags.map((tag) => <span key={tag} className="dir-tag-chip">{tag}</span>)}
        </div>
      )}
    </div>
  )
}

export const directoryEntryHeaderPuckComponent = {
  label: 'Directory: Entry Header [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: DirectoryEntryHeader,
}

export const directoryEntryHeaderPuckRscComponent = { ...directoryEntryHeaderPuckComponent, render: DirectoryEntryHeaderRsc }
