// Editor half only. The database-backed render lives in ./DirectoryCategoryHeader.rsc.
//
// This file is pulled into the Puck editor's client bundle through the generated
// module-components registry, so anything it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

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

export const directoryCategoryHeaderPuckComponent = {
  label: 'Directory: Category Header [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: DirectoryCategoryHeader,
}
