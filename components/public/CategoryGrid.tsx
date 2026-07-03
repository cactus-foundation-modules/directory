import Link from 'next/link'
import type { DirectoryCategory } from '@/modules/directory/lib/types'

type Props = { categories: Array<DirectoryCategory & { publishedCount: number }> }

export default function CategoryGrid({ categories }: Props) {
  if (categories.length === 0) return null
  return (
    <div className="dir-category-grid">
      {categories.map((category) => (
        <Link key={category.id} href={`/directory/${category.slug}`} className="dir-category-card">
          {category.icon && <span className="icon">{category.icon}</span>}
          <h3>{category.name}</h3>
          <p>{category.publishedCount} {category.publishedCount === 1 ? 'listing' : 'listings'}</p>
        </Link>
      ))}
    </div>
  )
}
