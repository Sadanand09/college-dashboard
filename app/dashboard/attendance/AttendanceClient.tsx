'use client'

import { useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

interface Student {
  _id: string
  name: string
  rollNo: string
  class: string
}

interface AttendanceRecord {
  _id: string
  studentId: string
  studentName: string
  class: string
  date: string
  status: 'present' | 'absent' | 'late'
}

type AttendanceStatus = 'present' | 'absent' | 'late'

const STATUS_BADGE: Record<AttendanceStatus, 'success' | 'danger' | 'warning'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
}

export function AttendanceClient() {
  const { toast } = useToast()
  const [tab, setTab] = useState<'mark' | 'history'>('mark')

  // Mark tab state
  const [students, setStudents] = useState<Student[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [statuses, setStatuses] = useState<Record<string, AttendanceStatus>>({})
  const [saving, setSaving] = useState(false)

  // History tab state
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0])
  const [historyClass, setHistoryClass] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Fetch students when class changes
  const fetchStudents = useCallback(async () => {
    if (!selectedClass) { setStudents([]); return }
    const res = await fetch(`/api/students?search=${encodeURIComponent(selectedClass)}&limit=100`)
    const data = await res.json()
    const classStudents = (data.students ?? []).filter((s: Student) => s.class === selectedClass)
    setStudents(classStudents)
    // Pre-fill statuses as present
    const init: Record<string, AttendanceStatus> = {}
    for (const s of classStudents) init[s._id] = 'present'
    setStatuses(init)
  }, [selectedClass])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  // Fetch history
  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true)
    try {
      const params = new URLSearchParams({ date: historyDate })
      if (historyClass) params.set('class', historyClass)
      const res = await fetch(`/api/attendance?${params}`)
      const data = await res.json()
      setRecords(Array.isArray(data) ? data : [])
    } finally {
      setLoadingHistory(false)
    }
  }, [historyDate, historyClass])

  useEffect(() => { if (tab === 'history') fetchHistory() }, [tab, fetchHistory])

  const saveAttendance = async () => {
    if (!selectedClass) { toast('Select a class first', 'warning'); return }
    if (students.length === 0) { toast('No students in this class', 'warning'); return }
    setSaving(true)
    const payload = students.map((s) => ({
      studentId: s._id,
      studentName: s.name,
      class: s.class,
      date,
      status: statuses[s._id] ?? 'present',
    }))
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    if (res.ok) toast(`Attendance saved for ${payload.length} students!`, 'success')
    else toast('Failed to save attendance', 'error')
  }

  const markAll = (status: AttendanceStatus) => {
    const updated: Record<string, AttendanceStatus> = {}
    for (const s of students) updated[s._id] = status
    setStatuses(updated)
  }

  const presentCount = Object.values(statuses).filter((s) => s === 'present').length
  const absentCount = Object.values(statuses).filter((s) => s === 'absent').length

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-slate-800 p-1 w-fit">
        {(['mark', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              tab === t
                ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            {t === 'mark' ? 'Mark Attendance' : 'History'}
          </button>
        ))}
      </div>

      {tab === 'mark' && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Class</label>
                <input
                  type="text"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  placeholder="e.g. B.Tech 3rd Year - A"
                  className="input w-56"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => markAll('present')}>All Present</Button>
                <Button size="sm" variant="secondary" onClick={() => markAll('absent')}>All Absent</Button>
              </div>
            </div>

            {students.length > 0 && (
              <div className="mt-4 flex gap-4 text-sm">
                <span className="text-emerald-600 font-medium">{presentCount} Present</span>
                <span className="text-red-500 font-medium">{absentCount} Absent</span>
                <span className="text-amber-500 font-medium">{students.length - presentCount - absentCount} Late</span>
              </div>
            )}
          </div>

          {/* Student list */}
          {students.length > 0 ? (
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-900/50">
                    <tr>
                      {['Student', 'Roll No', 'Present', 'Absent', 'Late'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {students.map((s) => (
                      <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-semibold text-sm flex-shrink-0">
                              {s.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.rollNo}</td>
                        {(['present', 'absent', 'late'] as AttendanceStatus[]).map((status) => (
                          <td key={status} className="px-4 py-3">
                            <input
                              type="radio"
                              name={`status-${s._id}`}
                              value={status}
                              checked={statuses[s._id] === status}
                              onChange={() => setStatuses((prev) => ({ ...prev, [s._id]: status }))}
                              className="h-4 w-4 accent-indigo-600 cursor-pointer"
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700">
                <Button loading={saving} onClick={saveAttendance}>Save Attendance</Button>
              </div>
            </div>
          ) : selectedClass ? (
            <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 py-16 text-center">
              <p className="text-gray-400 text-sm">No students found in class &quot;{selectedClass}&quot;.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 py-16 text-center">
              <p className="text-gray-400 text-sm">Enter a class name above to load students.</p>
            </div>
          )}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <div className="flex flex-wrap gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Date</label>
                <input type="date" value={historyDate} onChange={(e) => setHistoryDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Class (optional)</label>
                <input type="text" value={historyClass} onChange={(e) => setHistoryClass(e.target.value)} placeholder="Filter by class" className="input w-48" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            {loadingHistory ? (
              <div className="p-6"><TableSkeleton rows={5} /></div>
            ) : records.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-gray-400 text-sm">No attendance records for this date.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-slate-900/50">
                    <tr>
                      {['Student', 'Class', 'Date', 'Status'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                    {records.map((r) => (
                      <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{r.studentName}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{r.class}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{r.date}</td>
                        <td className="px-4 py-3">
                          <Badge variant={STATUS_BADGE[r.status]} className="capitalize">{r.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
