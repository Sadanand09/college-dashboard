import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { StudentsClient } from './StudentsClient'

export default function StudentsPage() {
  return (
    <DashboardShell title="Students">
      <StudentsClient />
    </DashboardShell>
  )
}
