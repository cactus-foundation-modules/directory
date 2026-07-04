import type { PuckData } from '@/modules/directory/lib/types'

const ENTRY_CONTEXT_BLOCKS = new Set(['DirectoryEntryHeader', 'DirectoryContactCard', 'DirectoryLocationMap', 'DirectoryRelatedEntries'])

type EntryContext = { entrySlug: string; categorySlug: string }

// The 'directoryEntry' layout's blocks have no per-instance entry slug of
// their own (they're a shared template rendered for every entry) - the entry
// page injects the current entry's context into each of these block types'
// props right before rendering, mirroring Shop's injectProductContext
// (modules/shop/lib/inject-product-context.ts).
function injectBlocks(blocks: unknown[], ctx: EntryContext): void {
  for (const item of blocks) {
    if (!item || typeof item !== 'object') continue
    const block = item as { type?: string; props?: Record<string, unknown> }
    if (block.type && ENTRY_CONTEXT_BLOCKS.has(block.type) && block.props) {
      block.props.entrySlug = ctx.entrySlug
      block.props.categorySlug = ctx.categorySlug
    }
    if (block.props) {
      for (const value of Object.values(block.props)) {
        if (Array.isArray(value)) injectBlocks(value, ctx)
      }
    }
  }
}

export function injectEntryContext(data: PuckData, ctx: EntryContext): PuckData {
  const cloned = JSON.parse(JSON.stringify(data)) as PuckData
  const content = Array.isArray(cloned.content) ? cloned.content : []
  const zoneBlocks = Object.values(cloned.zones ?? {}).flatMap((z) => (Array.isArray(z) ? z : []))
  injectBlocks([...content, ...zoneBlocks], ctx)
  return cloned
}
