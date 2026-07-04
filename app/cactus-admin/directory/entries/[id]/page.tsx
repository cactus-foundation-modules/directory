import { notFound } from 'next/navigation'
import { getSessionFromCookie } from '@/lib/auth/session'
import { hasPermission } from '@/lib/permissions/check'
import DirectoryNav from '@/modules/directory/components/admin/DirectoryNav'
import EntryEditor from '@/modules/directory/components/admin/EntryEditor'
import { getEntryById, listCategoriesWithCounts } from '@/modules/directory/lib/db'

export const metadata = { title: 'Directory Entry — Admin' }

type Props = { params: Promise<{ id: string }> }

export default async function DirectoryEntryPage({ params }: Props) {
  const user = await getSessionFromCookie()
  if (!user) return null
  const canManage = await hasPermission(user, 'directory.manage')
  if (!canManage) {
    return <div className="alert alert-danger">You do not have permission to manage Directory entries.</div>
  }

  const { id } = await params
  const categories = await listCategoriesWithCounts()

  if (id === 'new') {
    return (
      <div>
        <DirectoryNav />
        <EntryEditor entry={null} categories={categories} />
      </div>
    )
  }

  const entry = await getEntryById(id)
  if (!entry) notFound()

  return (
    <div>
      <DirectoryNav />
      <EntryEditor entry={entry} categories={categories} />
    </div>
  )
}
