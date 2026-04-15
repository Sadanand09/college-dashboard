import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { AssignmentsClient } from './AssignmentsClient'

export default function AssignmentsPage() {
  return (
    <DashboardShell title="Assignments">
      <AssignmentsClient />
    </DashboardShell>
  )
}
