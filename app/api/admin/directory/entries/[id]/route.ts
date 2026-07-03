import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { getEntryById, updateEntry, deleteEntry } from '@/modules/directory/lib/db'
import { slugifyName, ensureUniqueEntrySlug } from '@/modules/directory/lib/slug'
import type { PuckData } from '@/modules/directory/lib/types'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.access'))) return errorResponse('Forbidden', 403)

  const { id } = await params
  const entry = await getEntryById(id)
  if (!entry) return errorResponse('Not found', 404)
  return NextResponse.json(entry)
}

const PatchBody = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().min(1).max(200).optional(),
  slug: z.string().min(1).max(200).optional(),
  shortDescription: z.string().max(160).optional().nullable(),
  description: z.any().optional().nullable(),
  status: z.enum(['draft', 'published']).optional(),
  featured: z.boolean().optional(),
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
  images: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const { id } = await params
  const parsed = PatchBody.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')
  const data = parsed.data

  // Only re-slug when the client sends an explicit slug (it auto-fills from
  // name on the create form, but editing name afterwards must not silently
  // rewrite a slug someone has since customised or shared as a link).
  const slug = data.slug !== undefined ? await ensureUniqueEntrySlug(slugifyName(data.slug), id) : undefined

  await updateEntry(id, {
    categoryId: data.categoryId,
    name: data.name,
    slug,
    shortDescription: data.shortDescription,
    description: data.description as PuckData | null | undefined,
    status: data.status,
    featured: data.featured,
    featuredUntil: data.featuredUntil === undefined ? undefined : data.featuredUntil ? new Date(data.featuredUntil) : null,
    lat: data.lat,
    lng: data.lng,
    address: data.address,
    area: data.area,
    subArea: data.subArea,
    routeMarker: data.routeMarker,
    phone: data.phone,
    email: data.email === '' ? null : data.email,
    website: data.website,
    images: data.images,
    tags: data.tags,
  })

  const entry = await getEntryById(id)
  if (!entry) return errorResponse('Not found', 404)
  return NextResponse.json(entry)
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const { id } = await params
  await deleteEntry(id)
  return NextResponse.json({ ok: true })
}
