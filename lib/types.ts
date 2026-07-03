export type EntryStatus = 'draft' | 'published'

export type PuckData = { root: { props?: Record<string, any> }; content: any[]; zones?: Record<string, any> }

export type DirectoryCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  displayOrder: number
  createdAt: Date
  updatedAt: Date
}

export type DirectoryCategoryWithCount = DirectoryCategory & { entryCount: number }

export type DirectoryEntry = {
  id: string
  categoryId: string
  name: string
  slug: string
  shortDescription: string | null
  description: PuckData | null
  status: EntryStatus
  featured: boolean
  featuredUntil: Date | null
  lat: number | null
  lng: number | null
  address: string | null
  area: string | null
  subArea: string | null
  routeMarker: number | null
  phone: string | null
  email: string | null
  website: string | null
  images: string[]
  tags: string[]
  previewTokenHash: string | null
  previewTokenExpiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export type DirectoryEntryListItem = Omit<DirectoryEntry, 'description' | 'previewTokenHash'> & {
  categoryName: string
  categorySlug: string
}

export type DirectoryEntryWithCategory = DirectoryEntry & { categoryName: string; categorySlug: string }

export type DirectorySettings = {
  id: string
  introText: string | null
  mapCentreLat: number
  mapCentreLng: number
  mapZoom: number
  featuredLabel: string
  csvImportEnabled: boolean
  updatedAt: Date
}

export type DirectoryAccess = {
  isAdminUser: boolean
  canManage: boolean
}

export type DirectoryMapPin = {
  id: string
  name: string
  slug: string
  categoryName: string
  categorySlug: string
  shortDescription: string | null
  lat: number
  lng: number
  featured: boolean
}
