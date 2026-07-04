import { prisma } from '@/lib/db/prisma'
import type { MenuEntityKind, MenuEntitySearchResult, MenuEntityProvider, ResolvedMenuEntity } from '@/lib/modules/menu-entity-provider'

// Contributes to the "core.menu-entity-provider" extension point so the admin
// menu builder can link to Directory content.
const KINDS: MenuEntityKind[] = [
  { id: 'home', label: 'Directory home page' },
  { id: 'category', label: 'Directory category' },
  { id: 'listing', label: 'Directory listing' },
]

function listKinds(): MenuEntityKind[] {
  return KINDS
}

async function searchEntities(kind: string, query: string): Promise<MenuEntitySearchResult[]> {
  const q = `%${query}%`
  if (kind === 'home') {
    return [{ id: 'home', label: 'Directory home page' }]
  }
  if (kind === 'category') {
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
      SELECT "id", "name" FROM "dir_categories" WHERE "name" ILIKE ${q} ORDER BY "display_order" ASC LIMIT 20
    `
    return rows.map((r) => ({ id: r.id, label: r.name }))
  }
  if (kind === 'listing') {
    const rows = await prisma.$queryRaw<Array<{ id: string; name: string; status: string; category_name: string | null }>>`
      SELECT e."id", e."name", e."status", c."name" AS category_name
      FROM "dir_entries" e LEFT JOIN "dir_categories" c ON c."id" = e."category_id"
      WHERE e."name" ILIKE ${q} ORDER BY e."name" ASC LIMIT 20
    `
    return rows.map((r) => ({ id: r.id, label: r.name, hint: r.status !== 'published' ? `${r.category_name ?? ''} · draft`.trim() : r.category_name ?? undefined }))
  }
  return []
}

async function resolveEntity(kind: string, id: string): Promise<ResolvedMenuEntity | null> {
  if (kind === 'home') {
    return { label: 'Directory', href: '/directory', publiclyVisible: true }
  }
  if (kind === 'category') {
    const rows = await prisma.$queryRaw<Array<{ name: string; slug: string }>>`SELECT "name", "slug" FROM "dir_categories" WHERE "id" = ${id} LIMIT 1`
    if (!rows[0]) return null
    return { label: rows[0].name, href: `/directory/${rows[0].slug}`, publiclyVisible: true }
  }
  if (kind === 'listing') {
    const rows = await prisma.$queryRaw<Array<{ name: string; slug: string; status: string; category_slug: string }>>`
      SELECT e."name", e."slug", e."status", c."slug" AS category_slug
      FROM "dir_entries" e JOIN "dir_categories" c ON c."id" = e."category_id"
      WHERE e."id" = ${id} LIMIT 1
    `
    const entry = rows[0]
    if (!entry) return null
    return {
      label: entry.name,
      href: `/directory/${entry.category_slug}/${entry.slug}`,
      publiclyVisible: entry.status === 'published',
    }
  }
  return null
}

export const directoryMenuEntityProvider: MenuEntityProvider = {
  moduleLabel: 'Directory',
  listKinds,
  searchEntities,
  resolveEntity,
}
