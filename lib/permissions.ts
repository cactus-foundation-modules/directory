import { hasPermission, isAdmin } from '@/lib/permissions/check'
import type { SessionUser } from '@/lib/auth/session'
import type { DirectoryAccess } from './types'

export async function getDirectoryAccess(user: SessionUser): Promise<DirectoryAccess> {
  const isAdminUser = isAdmin(user)
  const canManage = isAdminUser || (await hasPermission(user, 'directory.manage'))
  return { isAdminUser, canManage }
}
