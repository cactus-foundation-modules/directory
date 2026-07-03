import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { getCategoryBySlug, createEntry } from '@/modules/directory/lib/db'
import { getDirectorySettings } from '@/modules/directory/lib/settings'
import { slugifyName, ensureUniqueEntrySlug } from '@/modules/directory/lib/slug'
import { buildProseDocument } from '@/modules/directory/lib/prose'

const Row = z.object({
  name: z.string().min(1).max(200),
  categorySlug: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  shortDescription: z.string().max(160).optional().nullable(),
  description: z.string().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  area: z.string().max(200).optional().nullable(),
  subArea: z.string().max(200).optional().nullable(),
  routeMarker: z.number().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  website: z.string().max(500).optional().nullable(),
  tags: z.array(z.string()).optional(),
  featuredUntil: z.string().datetime().optional().nullable(),
})

const Body = z.object({ rows: z.array(Row).min(1).max(1000) })

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const settings = await getDirectorySettings()
  if (!settings.csvImportEnabled) return errorResponse('CSV import is disabled', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const categoryCache = new Map<string, string | null>()
  let imported = 0
  const errors: Array<{ row: number; error: string }> = []

  for (const [index, row] of parsed.data.rows.entries()) {
    let categoryId = categoryCache.get(row.categorySlug)
    if (categoryId === undefined) {
      const category = await getCategoryBySlug(row.categorySlug)
      categoryId = category?.id ?? null
      categoryCache.set(row.categorySlug, categoryId)
    }
    if (!categoryId) {
      errors.push({ row: index, error: `Unknown category slug "${row.categorySlug}"` })
      continue
    }

    const slug = await ensureUniqueEntrySlug(slugifyName(row.name))
    await createEntry({
      categoryId,
      name: row.name,
      slug,
      shortDescription: row.shortDescription ?? null,
      description: row.description ? buildProseDocument(row.description) : null,
      status: 'draft',
      featured: false,
      featuredUntil: row.featuredUntil ? new Date(row.featuredUntil) : null,
      lat: row.lat,
      lng: row.lng,
      address: row.address ?? null,
      area: row.area ?? null,
      subArea: row.subArea ?? null,
      routeMarker: row.routeMarker ?? null,
      phone: row.phone ?? null,
      email: row.email || null,
      website: row.website ?? null,
      images: [],
      tags: row.tags ?? [],
    })
    imported++
  }

  return NextResponse.json({ imported, errors })
}
