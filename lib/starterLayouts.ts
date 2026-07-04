// Starter layout templates for the directoryCategory/directoryEntry layout
// types, collected by scripts/generate-module-layout-types.mjs (core) via this
// module's cactus.module.json layoutTypes.types[].starterImport/starterExport.
// Seeded as drafts only (see lib/setup/starterLayouts.ts) - the site owner
// opts in by publishing one.

const block = (type: string, id: string, props: Record<string, unknown> = {}) => ({ type, props: { id, ...props } })

const split = (id: string, ratio: string) => ({ type: 'Split', props: { id, ratio, align: 'stretch', gap: 'lg', padding: 'none' } })

const section = (id: string, overrides: Record<string, unknown> = {}) => ({
  type: 'Section',
  props: {
    id, bgType: 'none', bgColor: '', bgImage: '', bgSize: 'cover',
    overlayColor: '', overlayOpacity: 0, paddingY: 'md', maxWidth: 'standard',
    textColor: '', sticky: 'off', stickyOffset: '0px', boxShadow: 'none',
    borderStyle: 'none', borderColor: 'var(--color-border)', borderWidth: '1px',
    borderRadius: 'none', opacity: '100',
    animationType: 'none', animationDuration: 'normal', animationDelay: 'none',
    content: [],
    ...overrides,
  },
})

// ---------------------------------------------------------------------------
// Category templates (3)
// ---------------------------------------------------------------------------

export function directoryCategoryStarters() {
  return [
    {
      id: 'starter-directory-category-sidebar',
      name: 'Grid with Sidebar',
      description: 'Listings and filters on the left (70%), map on the right (30%).',
      data: {
        content: [
          block('DirectoryCategoryHeader', 'header-1'),
          split('columns-1', '70/30'),
        ],
        root: { props: {} },
        zones: {
          'columns-1:left': [block('DirectoryEntryBrowser', 'browser-1')],
          'columns-1:right': [block('DirectoryCategoryMap', 'map-1')],
        },
      },
    },
    {
      id: 'starter-directory-category-banner',
      name: 'Full Width with Banner',
      description: 'Header, full-width map banner, then a full-width grid of listings below.',
      data: {
        content: [
          block('DirectoryCategoryHeader', 'header-1'),
          block('DirectoryCategoryMap', 'map-1'),
          block('DirectoryEntryBrowser', 'browser-1'),
        ],
        root: { props: {} },
        zones: {},
      },
    },
    {
      id: 'starter-directory-category-compact',
      name: 'Compact List',
      description: 'Narrow boxed header, dense listing view, no map.',
      data: {
        content: [
          section('section-1', { maxWidth: 'narrow', content: [block('DirectoryCategoryHeader', 'header-1')] }),
          block('DirectoryEntryBrowser', 'browser-1'),
        ],
        root: { props: {} },
        zones: {},
      },
    },
  ]
}

// ---------------------------------------------------------------------------
// Entry templates (3)
// ---------------------------------------------------------------------------

export function directoryEntryStarters() {
  return [
    {
      id: 'starter-directory-entry-sidebar',
      name: 'Media-Forward with Sidebar',
      description: 'Main content (70%) with contact details and map in a sidebar (30%).',
      data: {
        content: [split('columns-1', '70/30')],
        root: { props: {} },
        zones: {
          'columns-1:left': [block('DirectoryEntryHeader', 'header-1')],
          'columns-1:right': [block('DirectoryContactCard', 'contact-1'), block('DirectoryLocationMap', 'map-1')],
        },
      },
    },
    {
      id: 'starter-directory-entry-hero',
      name: 'Full Width Hero then Details',
      description: 'Full-width header, boxed contact and location details, related listings below.',
      data: {
        content: [
          block('DirectoryEntryHeader', 'header-1'),
          section('section-1', { content: [block('DirectoryContactCard', 'contact-1'), block('DirectoryLocationMap', 'map-1')] }),
          block('DirectoryRelatedEntries', 'related-1'),
        ],
        root: { props: {} },
        zones: {},
      },
    },
    {
      id: 'starter-directory-entry-split',
      name: 'Two Column Split',
      description: 'Content on one side, contact and map on the other, related listings full-width beneath.',
      data: {
        content: [
          split('columns-1', '50/50'),
          block('DirectoryRelatedEntries', 'related-1'),
        ],
        root: { props: {} },
        zones: {
          'columns-1:left': [block('DirectoryEntryHeader', 'header-1')],
          'columns-1:right': [block('DirectoryContactCard', 'contact-1'), block('DirectoryLocationMap', 'map-1')],
        },
      },
    },
  ]
}
