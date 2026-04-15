import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { OverviewClient } from './OverviewClient'

export default function DashboardPage() {
  return (
    <DashboardShell title="Dashboard Overview">
      <OverviewClient />
    </DashboardShell>
  )
}
