import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { getDirectorySettings, updateDirectorySettings } from '@/modules/directory/lib/settings'

export async function GET() {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const settings = await getDirectorySettings()
  return NextResponse.json(settings)
}

const Body = z.object({
  introText: z.string().max(2000).optional().nullable(),
  mapCentreLat: z.number().min(-90).max(90).optional(),
  mapCentreLng: z.number().min(-180).max(180).optional(),
  mapZoom: z.number().int().min(1).max(18).optional(),
  featuredLabel: z.string().min(1).max(50).optional(),
  csvImportEnabled: z.boolean().optional(),
})

export async function PATCH(request: NextRequest) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const parsed = Body.safeParse(await request.json())
  if (!parsed.success) return errorResponse(parsed.error.issues[0]?.message ?? 'Invalid input')

  const settings = await updateDirectorySettings(parsed.data)
  return NextResponse.json(settings)
}
