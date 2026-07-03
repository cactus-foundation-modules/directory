import { prisma } from '@/lib/db/prisma'
import { generateSlug } from '@/lib/utils'

export function slugifyName(name: string): string {
  return generateSlug(name)
}

// Category slugs share the /directory/<category> URL space; entry slugs share
// /directory/<category>/<slug> - neither needs reserved words since categories
// and entries never collide on the same segment count.
export const RESERVED_ENTRY_SLUGS: string[] = []
export const RESERVED_CATEGORY_SLUGS = ['preview']

export async function ensureUniqueCategorySlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || 'category'
  let suffix = 2
  for (;;) {
    if (!RESERVED_CATEGORY_SLUGS.includes(slug)) {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "dir_categories" WHERE "slug" = ${slug} LIMIT 1
      `
      const clash = rows[0]
      if (!clash || clash.id === excludeId) return slug
    }
    slug = `${base || 'category'}-${suffix}`
    suffix += 1
  }
}

export async function ensureUniqueEntrySlug(base: string, excludeId?: string): Promise<string> {
  let slug = base || 'entry'
  let suffix = 2
  for (;;) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "dir_entries" WHERE "slug" = ${slug} LIMIT 1
    `
    const clash = rows[0]
    if (!clash || clash.id === excludeId) return slug
    slug = `${base || 'entry'}-${suffix}`
    suffix += 1
  }
}
