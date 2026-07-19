import { prisma } from '@/lib/db/prisma'

// Provider for the core.media-usage-providers extension point.
//
// A directory entry keeps its gallery as a JSONB array of Media ids, and its icon
// as a single reference. The array is handed back as raw text rather than parsed:
// core scans for any id it contains, so an entry with twelve photographs
// contributes one string and no per-row work.
export async function directoryMediaUsageProvider(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ ref: string | null }[]>`
    SELECT "images"::text AS ref FROM "dir_entries" WHERE "images" IS NOT NULL
    UNION ALL
    SELECT "icon" AS ref FROM "dir_categories" WHERE "icon" IS NOT NULL
  `
  return rows.map((r) => r.ref).filter((r): r is string => !!r)
}
