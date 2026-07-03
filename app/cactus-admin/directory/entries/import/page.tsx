import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import DirectoryNav from '@/modules/directory/components/admin/DirectoryNav'
import CsvImport from '@/modules/directory/components/admin/CsvImport'
import { listCategoriesWithCounts } from '@/modules/directory/lib/db'
import { getDirectorySettings } from '@/modules/directory/lib/settings'

export const metadata = { title: 'Import Directory Entries — Admin' }

export default async function DirectoryImportPage() {
  const user = await getSessionFromCookie()
  if (!user) return null
  const canManage = await hasPermission(user, 'directory.manage')
  if (!canManage) {
    return <div className="alert alert-danger">You do not have permission to manage Directory entries.</div>
  }

  const settings = await getDirectorySettings()
  if (!settings.csvImportEnabled) {
    const adminPath = (await headers()).get('x-cactus-admin-path') ?? 'cactus-admin'
    redirect(`/${adminPath}/m/directory/entries`)
  }

  const categories = await listCategoriesWithCounts()

  return (
    <div>
      <DirectoryNav />
      <div className="page-header"><h1 className="page-title">Import entries</h1></div>
      <CsvImport categorySlugs={categories.map((c) => c.slug)} />
    </div>
  )
}
