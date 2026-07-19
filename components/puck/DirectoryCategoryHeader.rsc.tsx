import { connection } from 'next/server'
import Link from 'next/link'
import { getCategoryBySlug } from '@/modules/directory/lib/db'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'
import { directoryCategoryHeaderPuckComponent, type DirectoryCategoryHeaderProps } from './DirectoryCategoryHeader'

export async function DirectoryCategoryHeaderRsc(props: DirectoryCategoryHeaderProps) {
  await connection()
  if (!props.categorySlug) return null
  const category = await getCategoryBySlug(props.categorySlug)
  if (!category) return null

  return (
    <div>
      <DirectoryStyles />
      <nav className="dir-breadcrumb" aria-label="Breadcrumb">
        <Link href="/directory">Directory</Link>
        <span>/</span>
        <span>{category.name}</span>
      </nav>
      <h1>{category.name}</h1>
      {category.description && <p style={{ fontSize: '1.125rem', color: 'var(--color-text-muted)' }}>{category.description}</p>}
    </div>
  )
}

export const directoryCategoryHeaderPuckRscComponent = { ...directoryCategoryHeaderPuckComponent, render: DirectoryCategoryHeaderRsc }
