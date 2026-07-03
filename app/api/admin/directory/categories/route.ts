import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { listCategoriesWithCounts, createCategory } from '@/modules/directory/lib/db'
import { slugifyName, ensureUniqueCategorySlug } from '@/modules/directory/lib/slug'

export async function GET() {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.access'))) return errorResponse('Forbidden', 403)

  const categories = await listCategoriesWithCounts()
  return NextResponse.json({ categories })
}

const CreateBody = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  icon: z.string().max(20).optional().nullable(),
})

export async function POST(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const parsed = CreateBody.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const slug = await ensureUniqueCategorySlug(slugifyName(parsed.data.name))
  const category = await createCategory({
    name: parsed.data.name,
    slug,
    description: parsed.data.description ?? null,
    icon: parsed.data.icon ?? null,
  })
  return NextResponse.json(category, { status: 201 })
}
