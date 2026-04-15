import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { AttendanceClient } from './AttendanceClient'

export default function AttendancePage() {
  return (
    <DashboardShell title="Attendance">
      <AttendanceClient />
    </DashboardShell>
  )
}
