'use client'

import { usePathname } from 'next/navigation'
import { useAdminPath } from '@/components/admin/AdminPathContext'
import { TabStrip } from '@/components/admin/TabStrip'

const TABS = [
  { label: 'Entries', segment: 'entries' },
  { label: 'Categories', segment: 'categories' },
]

export default function DirectoryNav() {
  const pathname = usePathname()
  const adminPath = useAdminPath()
  const base = `/${adminPath}/m/directory`

  return (
    <TabStrip
      style={{ marginBottom: '1.5rem' }}
      items={TABS.map((tab) => {
        const href = `${base}/${tab.segment}`
        return { key: tab.segment, label: tab.label, href, active: !!pathname?.startsWith(href) }
      })}
    />
  )
}
