import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { updateCategory, deleteCategory, getCategoryEntryCount } from '@/modules/directory/lib/db'
import { slugifyName, ensureUniqueCategorySlug } from '@/modules/directory/lib/slug'

type Params = { params: Promise<{ id: string }> }

const PatchBody = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  icon: z.string().max(20).optional().nullable(),
})

export async function PATCH(request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const { id } = await params
  const parsed = PatchBody.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const slug = parsed.data.name ? await ensureUniqueCategorySlug(slugifyName(parsed.data.name), id) : undefined
  const category = await updateCategory(id, { ...parsed.data, slug })
  if (!category) return errorResponse('Category not found', 404)
  return NextResponse.json(category)
}

// A category with entries in it can't be deleted - category_id is ON DELETE
// RESTRICT, so entries must be moved or removed first. No confirm-to-override.
export async function DELETE(_request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const { id } = await params
  const entryCount = await getCategoryEntryCount(id)
  if (entryCount > 0) {
    return NextResponse.json({ error: 'Category has entries', entryCount }, { status: 409 })
  }

  await deleteCategory(id)
  return NextResponse.json({ ok: true })
}
