import { connection } from 'next/server'
import { getEntryForPublic } from '@/modules/directory/lib/db'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'
import { directoryContactCardPuckComponent, type DirectoryContactCardProps } from './DirectoryContactCard'

export async function DirectoryContactCardRsc(props: DirectoryContactCardProps) {
  await connection()
  if (!props.categorySlug || !props.entrySlug) return null
  const entry = await getEntryForPublic(props.categorySlug, props.entrySlug)
  if (!entry) return null
  if (!entry.phone && !entry.email && !entry.website) return null

  return (
    <div className="dir-contact-card">
      <DirectoryStyles />
      <h3 style={{ marginTop: 0 }}>Contact</h3>
      {entry.phone && <div><a href={`tel:${entry.phone.replace(/[^+\d]/g, '')}`}>{entry.phone}</a></div>}
      {entry.email && <div><a href={`mailto:${entry.email}`}>{entry.email}</a></div>}
      {entry.website && <div><a href={entry.website} rel="noopener" target="_blank">{entry.website}</a></div>}
    </div>
  )
}

export const directoryContactCardPuckRscComponent = { ...directoryContactCardPuckComponent, render: DirectoryContactCardRsc }
