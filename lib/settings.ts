import { prisma } from '@/lib/db/prisma'
import type { DirectorySettings } from './types'

function mapRow(r: Record<string, unknown>): DirectorySettings {
  return {
    id: r.id as string,
    introText: (r.intro_text as string | null) ?? null,
    mapCentreLat: Number(r.map_centre_lat),
    mapCentreLng: Number(r.map_centre_lng),
    mapZoom: r.map_zoom as number,
    featuredLabel: r.featured_label as string,
    csvImportEnabled: r.csv_import_enabled as boolean,
    updatedAt: r.updated_at as Date,
  }
}

const FALLBACK: DirectorySettings = {
  id: 'singleton',
  introText: null,
  mapCentreLat: 51.505,
  mapCentreLng: -0.09,
  mapZoom: 11,
  featuredLabel: 'Featured',
  csvImportEnabled: true,
  updatedAt: new Date(),
}

export async function getDirectorySettings(): Promise<DirectorySettings> {
  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    SELECT * FROM "dir_settings" WHERE "id" = 'singleton' LIMIT 1
  `
  const row = rows[0]
  return row ? mapRow(row) : FALLBACK
}

export type UpdateSettingsInput = Partial<{
  introText: string | null
  mapCentreLat: number
  mapCentreLng: number
  mapZoom: number
  featuredLabel: string
  csvImportEnabled: boolean
}>

export async function updateDirectorySettings(input: UpdateSettingsInput): Promise<DirectorySettings> {
  const current = await getDirectorySettings()
  const merged = { ...current, ...input }

  await prisma.$executeRaw`
    INSERT INTO "dir_settings" (
      "id", "intro_text", "map_centre_lat", "map_centre_lng", "map_zoom",
      "featured_label", "csv_import_enabled", "updated_at"
    ) VALUES (
      'singleton', ${merged.introText}, ${merged.mapCentreLat}, ${merged.mapCentreLng}, ${merged.mapZoom},
      ${merged.featuredLabel}, ${merged.csvImportEnabled}, CURRENT_TIMESTAMP
    )
    ON CONFLICT ("id") DO UPDATE SET
      "intro_text" = ${merged.introText},
      "map_centre_lat" = ${merged.mapCentreLat},
      "map_centre_lng" = ${merged.mapCentreLng},
      "map_zoom" = ${merged.mapZoom},
      "featured_label" = ${merged.featuredLabel},
      "csv_import_enabled" = ${merged.csvImportEnabled},
      "updated_at" = CURRENT_TIMESTAMP
  `
  return getDirectorySettings()
}
