import { NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { distinctTags } from '@/modules/directory/lib/db'

export async function GET() {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.access'))) return errorResponse('Forbidden', 403)

  const tags = await distinctTags()
  return NextResponse.json({ tags })
}
