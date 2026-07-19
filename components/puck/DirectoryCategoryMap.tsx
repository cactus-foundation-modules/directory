// Editor half only. The database-backed render lives in ./DirectoryCategoryMap.rsc.
//
// This file is pulled into the Puck editor's client bundle through the generated
// module-components registry, so anything it imports ends up in the browser. It
// must never reach prisma: lib/db/prisma attaches a client extension at module
// scope, which throws on load in a browser and takes the whole page builder
// down, not just this block.

// categoryId is injected by the category page (lib/inject-category-context.ts)
export type DirectoryCategoryMapProps = { categoryId?: string }

export function DirectoryCategoryMap() {
  return <div style={{ height: 320, background: 'var(--color-border)', borderRadius: 8, opacity: 0.6 }} />
}

export const directoryCategoryMapPuckComponent = {
  label: 'Directory: Category Map',
  fields: {},
  defaultProps: {},
  render: DirectoryCategoryMap,
}
