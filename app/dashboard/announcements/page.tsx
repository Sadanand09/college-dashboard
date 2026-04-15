import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { AnnouncementsClient } from './AnnouncementsClient'

export default function AnnouncementsPage() {
  return (
    <DashboardShell title="Announcements">
      <AnnouncementsClient />
    </DashboardShell>
  )
}
