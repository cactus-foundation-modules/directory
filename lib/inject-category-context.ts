import type { PuckData } from '@/modules/directory/lib/types'

const CATEGORY_CONTEXT_BLOCKS = new Set(['DirectoryCategoryHeader', 'DirectoryEntryBrowser', 'DirectoryCategoryMap'])

type CategoryContext = { categorySlug: string; categoryId: string; area?: string; sort?: string }

// The 'directoryCategory' layout's blocks have no per-instance category slug
// of their own (they're a shared template rendered for every category) - the
// category page injects the current category's context into each of these
// block types' props right before rendering, mirroring Shop's
// injectProductContext (modules/shop/lib/inject-product-context.ts).
function injectBlocks(blocks: unknown[], ctx: CategoryContext): void {
  for (const item of blocks) {
    if (!item || typeof item !== 'object') continue
    const block = item as { type?: string; props?: Record<string, unknown> }
    if (block.type && CATEGORY_CONTEXT_BLOCKS.has(block.type) && block.props) {
      block.props.categorySlug = ctx.categorySlug
      block.props.categoryId = ctx.categoryId
      block.props.area = ctx.area
      block.props.sort = ctx.sort
    }
    if (block.props) {
      for (const value of Object.values(block.props)) {
        if (Array.isArray(value)) injectBlocks(value, ctx)
      }
    }
  }
}

export function injectCategoryContext(data: PuckData, ctx: CategoryContext): PuckData {
  const cloned = JSON.parse(JSON.stringify(data)) as PuckData
  const content = Array.isArray(cloned.content) ? cloned.content : []
  const zoneBlocks = Object.values(cloned.zones ?? {}).flatMap((z) => (Array.isArray(z) ? z : []))
  injectBlocks([...content, ...zoneBlocks], ctx)
  return cloned
}
