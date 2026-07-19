// Editor half only. The database-backed render lives in ./DirectoryRelatedEntries.rsc.
//
// This file is pulled into the Puck editor's client bundle through the generated
// module-components registry, so anything it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// categorySlug/entrySlug are injected by the entry page (lib/inject-entry-context.ts)
export type DirectoryRelatedEntriesProps = { categorySlug?: string; entrySlug?: string }

export function DirectoryRelatedEntries() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', opacity: 0.6 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ height: 160, background: 'var(--color-border)', borderRadius: 8 }} />
      ))}
    </div>
  )
}

export const directoryRelatedEntriesPuckComponent = {
  label: 'Directory: Related Entries',
  fields: {},
  defaultProps: {},
  render: DirectoryRelatedEntries,
}
