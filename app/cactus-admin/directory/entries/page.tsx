import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import DirectoryNav from '@/modules/directory/components/admin/DirectoryNav'
import EntriesScreen from '@/modules/directory/components/admin/EntriesScreen'

export const metadata = { title: 'Directory Entries — Admin' }

export default async function DirectoryEntriesPage() {
  const user = await getSessionFromCookie()
  if (!user) return null
  const canAccess = await hasPermission(user, 'directory.access')
  if (!canAccess) {
    return <div className="alert alert-danger">You do not have permission to view the Directory.</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Directory</h1>
      </div>
      <DirectoryNav />
      <EntriesScreen />
    </div>
  )
}
