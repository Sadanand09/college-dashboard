'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { CardSkeleton } from '@/components/ui/Skeleton'

interface Stats {
  totalStudents: number
  totalAssignments: number
  pendingAssignments: number
  attendancePct: number
  attendanceTrend: { date: string; present: number; absent: number }[]
  gradeDistribution: { grade: string; count: number }[]
  recentAnnouncements: { _id: string; title: string; createdAt: string }[]
  recentStudents: { _id: string; name: string; class: string; rollNo: string }[]
}

function StatCard({
  label,
  value,
  sub,
  color,
  icon,
  href,
}: {
  label: string
  value: string | number
  sub?: string
  color: string
  icon: React.ReactNode
  href?: string
}) {
  const inner = (
    <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 flex items-start gap-4 transition-shadow hover:shadow-lg cursor-pointer">
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${color} text-white flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-slate-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">{sub}</p>}
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }
  return inner
}

export function OverviewClient() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const responses = await Promise.all([
          fetch('/api/students?limit=5'),
          fetch('/api/assignments'),
          fetch('/api/attendance'),
          fetch('/api/grades'),
          fetch('/api/announcements?limit=5'),
        ])

        // Check all responses are ok
        for (const response of responses) {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        }

        const [students, assignments, attendance, grades, announcements] = await Promise.all(
          responses.map((r) => r.json())
        )

        // Attendance trend — last 7 unique dates
        const dateMap: Record<string, { present: number; absent: number; late: number; excused: number; unknown: number }> = {}
        for (const rec of attendance) {
          if (!dateMap[rec.date]) {
            dateMap[rec.date] = { present: 0, absent: 0, late: 0, excused: 0, unknown: 0 }
          }
          if (rec.status === 'present') {
            dateMap[rec.date].present++
          } else if (rec.status === 'absent') {
            dateMap[rec.date].absent++
          } else if (rec.status === 'late') {
            dateMap[rec.date].late++
          } else if (rec.status === 'excused') {
            dateMap[rec.date].excused++
          } else {
            dateMap[rec.date].unknown++
          }
        }
        const attendanceTrend = Object.entries(dateMap)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-7)
          .map(([date, v]) => ({ date: date.slice(5), present: v.present, absent: v.absent }))

        // Overall attendance %
        const totalRecs = attendance.length
        const presentRecs = attendance.filter((r: { status: string }) => r.status === 'present').length
        const attendancePct = totalRecs ? Math.round((presentRecs / totalRecs) * 100) : 0

        // Grade distribution
        const gradeCounts: Record<string, number> = {}
        for (const g of grades) {
          gradeCounts[g.grade || 'N/A'] = (gradeCounts[g.grade || 'N/A'] || 0) + 1
        }
        const gradeDistribution = Object.entries(gradeCounts).map(([grade, count]) => ({ grade, count }))

        setStats({
          totalStudents: students.total ?? 0,
          totalAssignments: assignments.assignments?.length ?? assignments.length ?? 0,
          pendingAssignments: (assignments.assignments ?? assignments).filter((a: { status: string }) => a.status === 'active').length,
          attendancePct,
          attendanceTrend,
          gradeDistribution,
          recentAnnouncements: announcements.slice(0, 5),
          recentStudents: students.students?.slice(0, 5) ?? [],
        })
        setError(null)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load dashboard data'
        console.error('OverviewClient load error:', err)
        setError(message)
        setStats(null)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10 p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500 text-white flex-shrink-0">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-900 dark:text-red-200">Failed to load dashboard</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            <button
              onClick={() => {
                setLoading(true)
                setError(null)
                // Retry logic would be added here if needed
                window.location.reload()
              }}
              className="mt-3 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 text-center">
        <p className="text-sm text-gray-500 dark:text-slate-400">No data available</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          sub="Enrolled this year"
          color="bg-indigo-500"
          href="/dashboard/students"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          label="Total Assignments"
          value={stats.totalAssignments}
          sub={`${stats.pendingAssignments} active`}
          color="bg-emerald-500"
          href="/dashboard/assignments"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
        <StatCard
          label="Attendance Rate"
          value={`${stats.attendancePct}%`}
          sub="Overall average"
          color="bg-amber-500"
          href="/dashboard/attendance"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          label="Pending Assignments"
          value={stats.pendingAssignments}
          sub="Awaiting closure"
          color="bg-rose-500"
          href="/dashboard/assignments"
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">
            Attendance Trend (last 7 days)
          </h2>
          {stats.attendanceTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={stats.attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No attendance data yet.</p>
          )}
        </div>

        {/* Grade Distribution */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">
            Grade Distribution
          </h2>
          {stats.gradeDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-400 text-center py-12">No grade data yet.</p>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Students */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Recently Added Students</h2>
          {stats.recentStudents.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No students yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentStudents.map((s) => (
                <li key={s._id} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex-shrink-0">
                    {(s.name?.charAt(0) ?? '?').toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.name}</p>
                    <p className="text-xs text-gray-400">Roll: {s.rollNo} · {s.class}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Announcements */}
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Recent Announcements</h2>
          {stats.recentAnnouncements.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">No announcements yet.</p>
          ) : (
            <ul className="space-y-3">
              {stats.recentAnnouncements.map((a) => (
                <li key={a._id} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-2 w-2 rounded-full bg-indigo-500 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{a.title}</p>
                    <p className="text-xs text-gray-400">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
