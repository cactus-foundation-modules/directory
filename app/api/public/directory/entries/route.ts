import { NextRequest, NextResponse } from 'next/server'
import { getCategoryBySlug, getPublishedMapPins } from '@/modules/directory/lib/db'

export async function GET(request: NextRequest) {
  const categorySlug = new URL(request.url).searchParams.get('category') ?? undefined
  const category = categorySlug ? await getCategoryBySlug(categorySlug) : null
  const pins = await getPublishedMapPins(category?.id)
  return NextResponse.json({ pins })
}
