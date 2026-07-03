import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { getEntryById, createEntry } from '@/modules/directory/lib/db'
import { slugifyName, ensureUniqueEntrySlug } from '@/modules/directory/lib/slug'

type Params = { params: Promise<{ id: string }> }

export async function POST(_request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const { id } = await params
  const source = await getEntryById(id)
  if (!source) return errorResponse('Not found', 404)

  const name = `${source.name} (copy)`
  const slug = await ensureUniqueEntrySlug(slugifyName(name))

  const created = await createEntry({
    categoryId: source.categoryId,
    name,
    slug,
    shortDescription: source.shortDescription,
    description: source.description,
    status: 'draft',
    featured: false,
    featuredUntil: null,
    lat: source.lat,
    lng: source.lng,
    address: source.address,
    area: source.area,
    subArea: source.subArea,
    routeMarker: source.routeMarker,
    phone: source.phone,
    email: source.email,
    website: source.website,
    images: source.images,
    tags: source.tags,
  })

  return NextResponse.json(created, { status: 201 })
}
