import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse, parsePaginationParams } from '@/lib/utils'
import { listEntriesAdmin, createEntry } from '@/modules/directory/lib/db'
import { slugifyName, ensureUniqueEntrySlug } from '@/modules/directory/lib/slug'
import type { PuckData } from '@/modules/directory/lib/types'

export async function GET(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.access'))) return errorResponse('Forbidden', 403)

  const sp = new URL(request.url).searchParams
  const { page, perPage } = parsePaginationParams(sp)
  const status = sp.get('status')
  const featured = sp.get('featured')

  const { entries, total } = await listEntriesAdmin({
    categoryId: sp.get('category') ?? undefined,
    status: status === 'draft' || status === 'published' ? status : undefined,
    featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
    missingLocation: sp.get('missingLocation') === 'true',
    q: sp.get('q') ?? undefined,
    page,
    perPage,
  })

  return NextResponse.json({ entries, total, page, perPage })
}

const CreateBody = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1).max(200),
  shortDescription: z.string().max(160).optional().nullable(),
  description: z.any().optional().nullable(),
  status: z.enum(['draft', 'published']).default('draft'),
  featured: z.boolean().default(false),
  featuredUntil: z.string().datetime().optional().nullable(),
  lat: z.number().min(-90).max(90).optional().nullable(),
  lng: z.number().min(-180).max(180).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  area: z.string().max(200).optional().nullable(),
  subArea: z.string().max(200).optional().nullable(),
  routeMarker: z.number().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().max(200).optional().nullable().or(z.literal('')),
  website: z.string().max(500).optional().nullable(),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
})

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const parsed = CreateBody.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
  const data = parsed.data

  const slug = await ensureUniqueEntrySlug(slugifyName(data.name))
  const { id } = await createEntry({
    categoryId: data.categoryId,
    name: data.name,
    slug,
    shortDescription: data.shortDescription ?? null,
    description: (data.description as PuckData | null) ?? null,
    status: data.status,
    featured: data.featured,
    featuredUntil: data.featuredUntil ? new Date(data.featuredUntil) : null,
    lat: data.lat ?? null,
    lng: data.lng ?? null,
    address: data.address ?? null,
    area: data.area ?? null,
    subArea: data.subArea ?? null,
    routeMarker: data.routeMarker ?? null,
    phone: data.phone ?? null,
    email: data.email || null,
    website: data.website ?? null,
    images: data.images,
    tags: data.tags,
  })

  return NextResponse.json({ id, slug }, { status: 201 })
}
