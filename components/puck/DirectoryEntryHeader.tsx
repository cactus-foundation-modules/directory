// Editor half only. The database-backed render lives in ./DirectoryEntryHeader.rsc.
//
// This file is pulled into the Puck editor's client bundle through the generated
// module-components registry, so anything it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

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

export const directoryEntryHeaderPuckComponent = {
  label: 'Directory: Entry Header [Anchor]',
  fields: {},
  defaultProps: {},
  permissions: { delete: false, duplicate: false },
  render: DirectoryEntryHeader,
}
