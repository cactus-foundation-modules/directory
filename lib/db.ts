import { prisma } from '@/lib/db/prisma'
import { Prisma } from '@prisma/client'
import type {
  DirectoryCategory, DirectoryCategoryWithCount, DirectoryEntry, DirectoryEntryListItem,
  DirectoryEntryWithCategory, DirectoryMapPin, EntryStatus, PuckData,
} from './types'

// ---------------------------------------------------------------------------
// Row mapping
// ---------------------------------------------------------------------------

function mapCategory(r: Record<string, unknown>): DirectoryCategory {
  return {
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    description: (r.description as string | null) ?? null,
    icon: (r.icon as string | null) ?? null,
    displayOrder: r.display_order as number,
    createdAt: r.created_at as Date,
    updatedAt: r.updated_at as Date,
  }
}

function mapEntry(r: Record<string, unknown>): DirectoryEntry {
  return {
    id: r.id as string,
    categoryId: r.category_id as string,
    name: r.name as string,
    slug: r.slug as string,
    shortDescription: (r.short_description as string | null) ?? null,
    description: (r.description as PuckData | null) ?? null,
    status: r.status as EntryStatus,
    featured: r.featured as boolean,
    featuredUntil: (r.featured_until as Date | null) ?? null,
    lat: r.lat !== null && r.lat !== undefined ? Number(r.lat) : null,
    lng: r.lng !== null && r.lng !== undefined ? Number(r.lng) : null,
    address: (r.address as string | null) ?? null,
    area: (r.area as string | null) ?? null,
    subArea: (r.sub_area as string | null) ?? null,
    routeMarker: r.route_marker !== null && r.route_marker !== undefined ? Number(r.route_marker) : null,
    phone: (r.phone as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    website: (r.website as string | null) ?? null,
    images: (r.images as string[] | null) ?? [],
    tags: (r.tags as string[] | null) ?? [],
    previewTokenHash: (r.preview_token_hash as string | null) ?? null,
    previewTokenExpiresAt: (r.preview_token_expires_at as Date | null) ?? null,
    createdAt: r.created_at as Date,
    updatedAt: r.updated_at as Date,
  }
}

function mapEntryWithCategory(r: Record<string, unknown>): DirectoryEntryWithCategory {
  return { ...mapEntry(r), categoryName: r.category_name as string, categorySlug: r.category_slug as string }
}

function mapEntryListItem(r: Record<string, unknown>): DirectoryEntryListItem {
  const { description: _description, previewTokenHash: _hash, ...rest } = mapEntryWithCategory({ ...r, description: null })
  return rest
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function listCategoriesWithCounts(): Promise<DirectoryCategoryWithCount[]> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT c.*, COUNT(e."id")::int AS entry_count
    FROM "dir_categories" c
    LEFT JOIN "dir_entries" e ON e."category_id" = c."id"
    GROUP BY c."id"
    ORDER BY c."display_order" ASC, c."name" ASC
  `
  return rows.map((r) => ({ ...mapCategory(r), entryCount: r.entry_count as number }))
}

export async function getCategoryById(id: string): Promise<DirectoryCategory | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "dir_categories" WHERE "id" = ${id} LIMIT 1`
  return rows[0] ? mapCategory(rows[0]) : null
}

export async function getCategoryBySlug(slug: string): Promise<DirectoryCategory | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`SELECT * FROM "dir_categories" WHERE "slug" = ${slug} LIMIT 1`
  return rows[0] ? mapCategory(rows[0]) : null
}

export async function createCategory(data: { name: string; slug: string; description: string | null; icon: string | null }): Promise<DirectoryCategory> {
  const [{ next_order }] = await prisma.$queryRaw<[{ next_order: number }]>`
    SELECT COALESCE(MAX("display_order") + 1, 0) AS next_order FROM "dir_categories"
  `
  const rows = await prisma.$queryRaw<[Record<string, unknown>]>`
    INSERT INTO "dir_categories" ("name", "slug", "description", "icon", "display_order")
    VALUES (${data.name}, ${data.slug}, ${data.description}, ${data.icon}, ${next_order})
    RETURNING *
  `
  return mapCategory(rows[0])
}

export type UpdateCategoryInput = Partial<{ name: string; slug: string; description: string | null; icon: string | null }>

export async function updateCategory(id: string, fields: UpdateCategoryInput): Promise<DirectoryCategory | null> {
  const sets: Prisma.Sql[] = []
  if (fields.name !== undefined) sets.push(Prisma.sql`"name" = ${fields.name}`)
  if (fields.slug !== undefined) sets.push(Prisma.sql`"slug" = ${fields.slug}`)
  if (fields.description !== undefined) sets.push(Prisma.sql`"description" = ${fields.description}`)
  if (fields.icon !== undefined) sets.push(Prisma.sql`"icon" = ${fields.icon}`)
  if (sets.length === 0) return getCategoryById(id)

  sets.push(Prisma.sql`"updated_at" = CURRENT_TIMESTAMP`)
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    UPDATE "dir_categories" SET ${Prisma.join(sets, ', ')} WHERE "id" = ${id} RETURNING *
  `
  return rows[0] ? mapCategory(rows[0]) : null
}

export async function getCategoryEntryCount(id: string): Promise<number> {
  const rows = await prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) FROM "dir_entries" WHERE "category_id" = ${id}`
  return Number(rows[0].count)
}

// Caller should check getCategoryEntryCount first and surface a 409 - the FK
// is ON DELETE RESTRICT as a backstop, not the primary UX.
export async function deleteCategory(id: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "dir_categories" WHERE "id" = ${id}`
}

export async function reorderCategories(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await prisma.$transaction(
    ids.map((id, index) => prisma.$executeRaw`UPDATE "dir_categories" SET "display_order" = ${index} WHERE "id" = ${id}`)
  )
}

// ---------------------------------------------------------------------------
// Entries - admin
// ---------------------------------------------------------------------------

// Wrapped in a function (not built eagerly at module scope) because this file is
// transitively imported by every Directory Puck block - including the client-safe
// editor render path - and Prisma.sql throws immediately if evaluated in a
// browser bundle. Deferring the tagged template to call time keeps it inert
// until a server-side data-access function actually invokes it.
function entryColumnsSql() {
  return Prisma.sql`
    e."id", e."category_id", e."name", e."slug", e."short_description", e."status", e."featured", e."featured_until",
    e."lat", e."lng", e."address", e."area", e."sub_area", e."route_marker", e."phone", e."email", e."website",
    e."images", e."tags", e."created_at", e."updated_at", c."name" AS category_name, c."slug" AS category_slug
  `
}

export type ListEntriesFilter = {
  categoryId?: string
  status?: EntryStatus
  featured?: boolean
  missingLocation?: boolean
  q?: string
  page?: number
  perPage?: number
}

export async function listEntriesAdmin(opts: ListEntriesFilter): Promise<{ entries: DirectoryEntryListItem[]; total: number }> {
  const page = opts.page ?? 1
  const perPage = opts.perPage ?? 25
  const offset = (page - 1) * perPage

  const conditions: Prisma.Sql[] = []
  if (opts.categoryId) conditions.push(Prisma.sql`e."category_id" = ${opts.categoryId}`)
  if (opts.status) conditions.push(Prisma.sql`e."status" = ${opts.status}`)
  if (opts.featured !== undefined) conditions.push(Prisma.sql`e."featured" = ${opts.featured}`)
  if (opts.missingLocation) conditions.push(Prisma.sql`(e."lat" IS NULL OR e."lng" IS NULL)`)
  if (opts.q) conditions.push(Prisma.sql`(e."name" ILIKE ${'%' + opts.q + '%'} OR e."area" ILIKE ${'%' + opts.q + '%'})`)

  const where = conditions.length ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}` : Prisma.empty

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT ${entryColumnsSql()} FROM "dir_entries" e JOIN "dir_categories" c ON c."id" = e."category_id"
      ${where} ORDER BY e."updated_at" DESC LIMIT ${perPage} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) FROM "dir_entries" e JOIN "dir_categories" c ON c."id" = e."category_id" ${where}
    `,
  ])

  return { entries: rows.map(mapEntryListItem), total: Number(countRows[0].count) }
}

export async function getEntryById(id: string): Promise<DirectoryEntryWithCategory | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT e.*, c."name" AS category_name, c."slug" AS category_slug
    FROM "dir_entries" e JOIN "dir_categories" c ON c."id" = e."category_id"
    WHERE e."id" = ${id} LIMIT 1
  `
  return rows[0] ? mapEntryWithCategory(rows[0]) : null
}

export type CreateEntryInput = {
  categoryId: string
  name: string
  slug: string
  shortDescription: string | null
  description: PuckData | null
  status: EntryStatus
  featured: boolean
  featuredUntil: Date | null
  lat: number | null
  lng: number | null
  address: string | null
  area: string | null
  subArea: string | null
  routeMarker: number | null
  phone: string | null
  email: string | null
  website: string | null
  images: string[]
  tags: string[]
}

export async function createEntry(data: CreateEntryInput): Promise<{ id: string }> {
  const rows = await prisma.$queryRaw<[{ id: string }]>`
    INSERT INTO "dir_entries" (
      "category_id", "name", "slug", "short_description", "description", "status", "featured", "featured_until",
      "lat", "lng", "address", "area", "sub_area", "route_marker", "phone", "email", "website", "images", "tags"
    ) VALUES (
      ${data.categoryId}, ${data.name}, ${data.slug}, ${data.shortDescription},
      ${data.description ? JSON.stringify(data.description) : null}::jsonb,
      ${data.status}, ${data.featured}, ${data.featuredUntil},
      ${data.lat}, ${data.lng}, ${data.address}, ${data.area}, ${data.subArea}, ${data.routeMarker},
      ${data.phone}, ${data.email}, ${data.website},
      ${JSON.stringify(data.images)}::jsonb, ${JSON.stringify(data.tags)}::jsonb
    )
    RETURNING "id"
  `
  return rows[0]
}

export type UpdateEntryInput = Partial<{
  categoryId: string
  name: string
  slug: string
  shortDescription: string | null
  description: PuckData | null
  status: EntryStatus
  featured: boolean
  featuredUntil: Date | null
  lat: number | null
  lng: number | null
  address: string | null
  area: string | null
  subArea: string | null
  routeMarker: number | null
  phone: string | null
  email: string | null
  website: string | null
  images: string[]
  tags: string[]
}>

export async function updateEntry(id: string, fields: UpdateEntryInput): Promise<void> {
  const sets: Prisma.Sql[] = []
  if (fields.categoryId !== undefined) sets.push(Prisma.sql`"category_id" = ${fields.categoryId}`)
  if (fields.name !== undefined) sets.push(Prisma.sql`"name" = ${fields.name}`)
  if (fields.slug !== undefined) sets.push(Prisma.sql`"slug" = ${fields.slug}`)
  if (fields.shortDescription !== undefined) sets.push(Prisma.sql`"short_description" = ${fields.shortDescription}`)
  if (fields.description !== undefined) sets.push(Prisma.sql`"description" = ${fields.description ? JSON.stringify(fields.description) : null}::jsonb`)
  if (fields.status !== undefined) sets.push(Prisma.sql`"status" = ${fields.status}`)
  if (fields.featured !== undefined) sets.push(Prisma.sql`"featured" = ${fields.featured}`)
  if (fields.featuredUntil !== undefined) sets.push(Prisma.sql`"featured_until" = ${fields.featuredUntil}`)
  if (fields.lat !== undefined) sets.push(Prisma.sql`"lat" = ${fields.lat}`)
  if (fields.lng !== undefined) sets.push(Prisma.sql`"lng" = ${fields.lng}`)
  if (fields.address !== undefined) sets.push(Prisma.sql`"address" = ${fields.address}`)
  if (fields.area !== undefined) sets.push(Prisma.sql`"area" = ${fields.area}`)
  if (fields.subArea !== undefined) sets.push(Prisma.sql`"sub_area" = ${fields.subArea}`)
  if (fields.routeMarker !== undefined) sets.push(Prisma.sql`"route_marker" = ${fields.routeMarker}`)
  if (fields.phone !== undefined) sets.push(Prisma.sql`"phone" = ${fields.phone}`)
  if (fields.email !== undefined) sets.push(Prisma.sql`"email" = ${fields.email}`)
  if (fields.website !== undefined) sets.push(Prisma.sql`"website" = ${fields.website}`)
  if (fields.images !== undefined) sets.push(Prisma.sql`"images" = ${JSON.stringify(fields.images)}::jsonb`)
  if (fields.tags !== undefined) sets.push(Prisma.sql`"tags" = ${JSON.stringify(fields.tags)}::jsonb`)
  if (sets.length === 0) return

  sets.push(Prisma.sql`"updated_at" = CURRENT_TIMESTAMP`)
  await prisma.$executeRaw`UPDATE "dir_entries" SET ${Prisma.join(sets, ', ')} WHERE "id" = ${id}`
}

export async function deleteEntry(id: string): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "dir_entries" WHERE "id" = ${id}`
}

export async function bulkDeleteEntries(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  await prisma.$executeRaw`DELETE FROM "dir_entries" WHERE "id" IN (${Prisma.join(ids)})`
}

export async function bulkUpdateStatus(ids: string[], status: EntryStatus): Promise<void> {
  if (ids.length === 0) return
  await prisma.$executeRaw`
    UPDATE "dir_entries" SET "status" = ${status}, "updated_at" = CURRENT_TIMESTAMP WHERE "id" IN (${Prisma.join(ids)})
  `
}

export async function distinctTags(): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ tag: string }>>`
    SELECT DISTINCT jsonb_array_elements_text("tags") AS tag FROM "dir_entries" ORDER BY tag ASC
  `
  return rows.map((r) => r.tag)
}

export async function setPreviewToken(id: string, hash: string, expiresAt: Date): Promise<void> {
  await prisma.$executeRaw`
    UPDATE "dir_entries" SET "preview_token_hash" = ${hash}, "preview_token_expires_at" = ${expiresAt}
    WHERE "id" = ${id}
  `
}

export async function getEntryByPreviewTokenHash(hash: string): Promise<DirectoryEntryWithCategory | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT e.*, c."name" AS category_name, c."slug" AS category_slug
    FROM "dir_entries" e JOIN "dir_categories" c ON c."id" = e."category_id"
    WHERE e."preview_token_hash" = ${hash} AND e."preview_token_expires_at" > NOW()
    LIMIT 1
  `
  return rows[0] ? mapEntryWithCategory(rows[0]) : null
}

export async function expireFeatured(): Promise<number> {
  const result = await prisma.$executeRaw`
    UPDATE "dir_entries" SET "featured" = false, "featured_until" = NULL, "updated_at" = CURRENT_TIMESTAMP
    WHERE "featured" = true AND "featured_until" IS NOT NULL AND "featured_until" <= NOW()
  `
  return Number(result)
}

export async function getDashboardCounts(): Promise<{ published: number; drafts: number; missingCoordinates: number; featured: number }> {
  const [row] = await prisma.$queryRaw<[{ published: bigint; drafts: bigint; missing_coordinates: bigint; featured: bigint }]>`
    SELECT
      (SELECT COUNT(*) FROM "dir_entries" WHERE "status" = 'published') AS published,
      (SELECT COUNT(*) FROM "dir_entries" WHERE "status" = 'draft') AS drafts,
      (SELECT COUNT(*) FROM "dir_entries" WHERE "lat" IS NULL OR "lng" IS NULL) AS missing_coordinates,
      (SELECT COUNT(*) FROM "dir_entries" WHERE "featured" = true AND ("featured_until" IS NULL OR "featured_until" > NOW())) AS featured
  `
  return {
    published: Number(row.published),
    drafts: Number(row.drafts),
    missingCoordinates: Number(row.missing_coordinates),
    featured: Number(row.featured),
  }
}

// ---------------------------------------------------------------------------
// Entries - public
// ---------------------------------------------------------------------------

export async function getPublishedEntries(opts: { page?: number; perPage?: number }): Promise<{ entries: DirectoryEntryListItem[]; total: number }> {
  const page = opts.page ?? 1
  const perPage = opts.perPage ?? 24
  const offset = (page - 1) * perPage

  const [rows, countRows] = await Promise.all([
    prisma.$queryRaw<Record<string, unknown>[]>`
      SELECT ${entryColumnsSql()} FROM "dir_entries" e JOIN "dir_categories" c ON c."id" = e."category_id"
      WHERE e."status" = 'published'
      ORDER BY (e."featured" AND (e."featured_until" IS NULL OR e."featured_until" > NOW())) DESC, e."created_at" DESC
      LIMIT ${perPage} OFFSET ${offset}
    `,
    prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) FROM "dir_entries" WHERE "status" = 'published'`,
  ])

  return { entries: rows.map(mapEntryListItem), total: Number(countRows[0].count) }
}

export type CategorySort = 'newest' | 'alphabetical' | 'route_marker'

export async function getPublishedEntriesForCategory(categoryId: string, opts: { area?: string; sort?: CategorySort } = {}): Promise<DirectoryEntryListItem[]> {
  const conditions = [Prisma.sql`e."category_id" = ${categoryId}`, Prisma.sql`e."status" = 'published'`]
  if (opts.area) conditions.push(Prisma.sql`e."area" = ${opts.area}`)
  const where = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`

  const orderBy =
    opts.sort === 'alphabetical' ? Prisma.sql`e."name" ASC` :
    opts.sort === 'route_marker' ? Prisma.sql`e."route_marker" ASC NULLS LAST, e."name" ASC` :
    Prisma.sql`e."created_at" DESC`

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT ${entryColumnsSql()} FROM "dir_entries" e JOIN "dir_categories" c ON c."id" = e."category_id"
    ${where}
    ORDER BY (e."featured" AND (e."featured_until" IS NULL OR e."featured_until" > NOW())) DESC, ${orderBy}
  `
  return rows.map(mapEntryListItem)
}

export async function getDistinctAreasForCategory(categoryId: string): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ area: string }>>`
    SELECT DISTINCT "area" FROM "dir_entries"
    WHERE "category_id" = ${categoryId} AND "status" = 'published' AND "area" IS NOT NULL
    ORDER BY "area" ASC
  `
  return rows.map((r) => r.area)
}

export async function categoryHasRouteMarkers(categoryId: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<[{ exists: boolean }]>`
    SELECT EXISTS(SELECT 1 FROM "dir_entries" WHERE "category_id" = ${categoryId} AND "status" = 'published' AND "route_marker" IS NOT NULL) AS exists
  `
  return rows[0].exists
}

export async function getPublishedCategoryCounts(): Promise<Map<string, number>> {
  const rows = await prisma.$queryRaw<Array<{ category_id: string; count: bigint }>>`
    SELECT "category_id", COUNT(*) AS count FROM "dir_entries" WHERE "status" = 'published' GROUP BY "category_id"
  `
  return new Map(rows.map((r) => [r.category_id, Number(r.count)]))
}

export async function getEntryForPublic(categorySlug: string, slug: string): Promise<DirectoryEntryWithCategory | null> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT e.*, c."name" AS category_name, c."slug" AS category_slug
    FROM "dir_entries" e JOIN "dir_categories" c ON c."id" = e."category_id"
    WHERE e."slug" = ${slug} AND c."slug" = ${categorySlug} AND e."status" = 'published'
    LIMIT 1
  `
  return rows[0] ? mapEntryWithCategory(rows[0]) : null
}

export async function getPublishedMapPins(categoryId?: string): Promise<DirectoryMapPin[]> {
  const conditions = [Prisma.sql`e."status" = 'published'`, Prisma.sql`e."lat" IS NOT NULL`, Prisma.sql`e."lng" IS NOT NULL`]
  if (categoryId) conditions.push(Prisma.sql`e."category_id" = ${categoryId}`)

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT e."id", e."name", e."slug", e."short_description", e."lat", e."lng", e."featured",
      c."name" AS category_name, c."slug" AS category_slug
    FROM "dir_entries" e JOIN "dir_categories" c ON c."id" = e."category_id"
    WHERE ${Prisma.join(conditions, ' AND ')}
  `
  return rows.map((r) => ({
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    categoryName: r.category_name as string,
    categorySlug: r.category_slug as string,
    shortDescription: (r.short_description as string | null) ?? null,
    lat: Number(r.lat),
    lng: Number(r.lng),
    featured: r.featured as boolean,
  }))
}
