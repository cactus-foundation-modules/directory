// Editor half only. The database-backed render lives in ./DirectoryLocationMap.rsc.
//
// This file is pulled into the Puck editor's client bundle through the generated
// module-components registry, so anything it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// categorySlug/entrySlug are injected by the entry page (lib/inject-entry-context.ts)
export type DirectoryLocationMapProps = { categorySlug?: string; entrySlug?: string }

export function DirectoryLocationMap() {
  return <div style={{ height: 240, background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export const directoryLocationMapPuckComponent = {
  label: 'Directory: Location Map',
  fields: {},
  defaultProps: {},
  render: DirectoryLocationMap,
}
