import { prisma } from '@/lib/db/prisma'

// Resolves Media.id -> url in bulk for a batch of entries' cover images
// (images[0]) - no FK to core Media, so this is a manual join.
export async function getCoverUrls(coverIds: Array<string | null>): Promise<Map<string, string>> {
  const ids = [...new Set(coverIds.filter((id): id is string => !!id))]
  if (ids.length === 0) return new Map()
  const rows = await prisma.media.findMany({ where: { id: { in: ids } }, select: { id: true, url: true } })
  return new Map(rows.map((r) => [r.id, r.url]))
}

export async function getMediaUrls(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map()
  const rows = await prisma.media.findMany({ where: { id: { in: ids } }, select: { id: true, url: true } })
  return new Map(rows.map((r) => [r.id, r.url]))
}
