import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { GradesClient } from './GradesClient'

export default function GradesPage() {
  return (
    <DashboardShell title="Grades">
      <GradesClient />
    </DashboardShell>
  )
}
