import { headers } from 'next/headers'
import { getDashboardCounts } from '@/modules/directory/lib/db'

// Contributed to the core `core.admin-dashboard-widgets` extension point.
// Server component, self-contained data fetch.
export async function directoryDashboardWidget() {
  const counts = await getDashboardCounts()
  const adminPath = (await headers()).get('x-cactus-admin-path') ?? ''

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h2 className="card-title" style={{ margin: '0 0 0.75rem' }}>Directory</h2>
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
        <div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{counts.published}</div><div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Published</div></div>
        <div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{counts.drafts}</div><div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Drafts</div></div>
        <div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{counts.featured}</div><div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Featured</div></div>
        <div><div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{counts.missingCoordinates}</div><div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Missing location</div></div>
      </div>
      <a href={`/${adminPath}/m/directory/entries`} style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)', textDecoration: 'none' }}>Manage Directory →</a>
    </div>
  )
}
