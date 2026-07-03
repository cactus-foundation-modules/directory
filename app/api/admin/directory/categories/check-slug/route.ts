import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { getCategoryBySlug } from '@/modules/directory/lib/db'
import { slugifyName, ensureUniqueCategorySlug, RESERVED_CATEGORY_SLUGS } from '@/modules/directory/lib/slug'

export async function GET(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const searchParams = new URL(request.url).searchParams
  const rawSlug = searchParams.get('slug') ?? ''
  const excludeId = searchParams.get('excludeId') ?? undefined
  const base = slugifyName(rawSlug)
  if (!base) return errorResponse('Slug is required')

  const existing = RESERVED_CATEGORY_SLUGS.includes(base) ? { id: '__reserved__' } : await getCategoryBySlug(base)
  const available = !existing || existing.id === excludeId
  const suggested = available ? base : await ensureUniqueCategorySlug(base, excludeId)

  return NextResponse.json({ available, suggested })
}
