import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db/prisma'

export async function getPublicSitemapEntries(siteUrl: string): Promise<MetadataRoute.Sitemap> {
  const rows = await prisma.$queryRaw<Array<{ slug: string; updated_at: Date; category_slug: string; category_updated_at: Date }>>`
    SELECT e."slug", e."updated_at", c."slug" AS category_slug, c."updated_at" AS category_updated_at
    FROM "dir_entries" e
    JOIN "dir_categories" c ON c."id" = e."category_id"
    WHERE e."status" = 'published'
    ORDER BY e."updated_at" DESC
  `

  const categoryLastMod = new Map<string, Date>()
  for (const r of rows) {
    const current = categoryLastMod.get(r.category_slug)
    if (!current || r.updated_at > current) categoryLastMod.set(r.category_slug, r.updated_at)
  }

  const entries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/directory`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
  ]

  for (const [categorySlug, lastModified] of categoryLastMod) {
    entries.push({ url: `${siteUrl}/directory/${categorySlug}`, lastModified, changeFrequency: 'weekly', priority: 0.6 })
  }

  for (const r of rows) {
    entries.push({ url: `${siteUrl}/directory/${r.category_slug}/${r.slug}`, lastModified: r.updated_at, changeFrequency: 'monthly', priority: 0.5 })
  }

  return entries
}
