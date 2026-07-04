import { connection } from 'next/server'
import Link from 'next/link'
import { getCategoryBySlug } from '@/modules/directory/lib/db'
import DirectoryStyles from '@/modules/directory/components/public/DirectoryStyles'

// [ANCHOR] - categorySlug is injected by the category page (lib/inject-category-context.ts)
export type DirectoryCategoryHeaderProps = { categorySlug?: string }

export function DirectoryCategoryHeader() {
  return (
    <div style={{ opacity: 0.6 }}>
      <div style={{ height: 14, width: '20%', background: 'var(--color-border)', borderRadius: 4, marginBottom: '0.75rem' }} />
      <div style={{ height: 32, width: '40%', background: 'var(--color-border)', borderRadius: 4, marginBottom: '0.5rem' }} />
      <div style={{ height: 18, width: '60%', background: 'var(--color-border)', borderRadius: 4 }} />
    </div>
  )
}

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

export const directoryCategoryHeaderPuckComponent = {
  label: 'Directory: Category Header [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: DirectoryCategoryHeader,
}

export const directoryCategoryHeaderPuckRscComponent = { ...directoryCategoryHeaderPuckComponent, render: DirectoryCategoryHeaderRsc }
