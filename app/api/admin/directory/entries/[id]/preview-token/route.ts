import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import { errorResponse } from '@/lib/utils'
import { getEntryById, setPreviewToken } from '@/modules/directory/lib/db'
import { generatePreviewToken, hashPreviewToken, previewTokenExpiry } from '@/modules/directory/lib/preview'

type Params = { params: Promise<{ id: string }> }

// Regenerating overwrites the previous hash, invalidating any link shared before.
export async function POST(_request: NextRequest, { params }: Params) {
  const user = await getSessionFromCookie()
  if (!user) return errorResponse('Not authenticated', 401)
  if (!(await hasPermission(user, 'directory.manage'))) return errorResponse('Forbidden', 403)

  const { id } = await params
  const entry = await getEntryById(id)
  if (!entry) return errorResponse('Not found', 404)

  const token = generatePreviewToken()
  await setPreviewToken(id, hashPreviewToken(token), previewTokenExpiry())

  return NextResponse.json({ token })
}
