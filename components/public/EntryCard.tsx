import Link from 'next/link'
import type { DirectoryEntryListItem } from '@/modules/directory/lib/types'

type Props = { entry: DirectoryEntryListItem; coverUrl: string | null; featuredLabel: string }

export default function EntryCard({ entry, coverUrl, featuredLabel }: Props) {
  return (
    <Link href={`/directory/${entry.categorySlug}/${entry.slug}`} className="dir-entry-card">
      {entry.featured && <span className="badge badge-primary featured-flag">{featuredLabel}</span>}
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverUrl} alt="" />
      )}
      <div className={`dir-entry-card-body${!coverUrl && entry.featured ? ' dir-entry-card-body--badge-clear' : ''}`}>
        <h3>{entry.name}</h3>
        {entry.shortDescription && <p>{entry.shortDescription}</p>}
        <div className="dir-entry-card-meta">
          <span>{entry.categoryName}</span>
          {entry.area && <span>{entry.area}</span>}
        </div>
      </div>
    </Link>
  )
}
