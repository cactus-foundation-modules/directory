import { NextRequest, NextResponse } from 'next/server'
import { errorResponse } from '@/lib/utils'
import { expireFeatured } from '@/modules/directory/lib/db'

// Vercel Cron always invokes via GET (appending `Authorization: Bearer
// $CRON_SECRET` automatically), same as boards' digest cron; POST is also
// accepted for manual/admin-triggered runs.
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return errorResponse('CRON_SECRET is not configured', 503)

  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${secret}`) return errorResponse('Unauthorized', 401)

  const count = await expireFeatured()
  return NextResponse.json({ ok: true, expired: count })
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
