import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { ProfileClient } from './ProfileClient'

export default function ProfilePage() {
  return (
    <DashboardShell title="My Profile">
      <ProfileClient />
    </DashboardShell>
  )
}
