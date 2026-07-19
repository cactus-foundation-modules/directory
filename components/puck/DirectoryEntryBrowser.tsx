// Editor half only. The database-backed render lives in ./DirectoryEntryBrowser.rsc.
//
// This file is pulled into the Puck editor's client bundle through the generated
// module-components registry, so anything it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// [ANCHOR] - categoryId/categorySlug/area/sort are injected by the category
// page (lib/inject-category-context.ts). viewMode/pageSize are the only
// author-configurable fields.
export type DirectoryEntryBrowserProps = {
  categorySlug?: string
  categoryId?: string
  area?: string
  sort?: string
  pageSize?: number
}

export function DirectoryEntryBrowser() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', opacity: 0.6 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 180, background: 'var(--color-border)', borderRadius: 8 }} />
      ))}
    </div>
  )
}

export const directoryEntryBrowserPuckComponent = {
  label: 'Directory: Entry Browser [Anchor]',
  fields: {
    pageSize: { type: 'number' as const, label: 'Max entries shown (blank = all)' },
  },
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: DirectoryEntryBrowser,
}
