'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

interface Student {
  _id: string
  name: string
  rollNo: string
  class: string
  email: string
  phone: string
  parentName: string
  parentPhone: string
  createdAt?: string
}

interface AttendanceRecord {
  _id: string
  studentId: string
  status: 'present' | 'absent' | 'late'
  date: string
  class: string
}

interface GradeRecord {
  _id: string
  subject: string
  marks: number
  maxMarks: number
  grade: string
  term: string
}

interface FormData {
  name: string
  rollNo: string
  class: string
  email: string
  phone: string
  parentName: string
  parentPhone: string
}

const GRADE_COLOR: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  'A+': 'success', A: 'success', 'B+': 'info', B: 'info', C: 'warning', D: 'warning', F: 'danger',
}

// Slide-in drawer component
function StudentDrawer({
  student,
  onClose,
  onEdit,
}: {
  student: Student
  onClose: () => void
  onEdit: () => void
}) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [grades, setGrades] = useState<GradeRecord[]>([])
  const [loadingDetails, setLoadingDetails] = useState(true)

  useEffect(() => {
    async function load() {
      setLoadingDetails(true)
      try {
        const [attRes, gradeRes] = await Promise.all([
          fetch(`/api/attendance?studentId=${student._id}`),
          fetch(`/api/grades?studentId=${student._id}`),
        ])
        const attData = attRes.ok ? await attRes.json() : []
        const gradeData = gradeRes.ok ? await gradeRes.json() : []
        setAttendance(Array.isArray(attData) ? attData : [])
        setGrades(Array.isArray(gradeData) ? gradeData : [])
      } catch {
        // silently fail — drawer still shows static info
      } finally {
        setLoadingDetails(false)
      }
    }
    load()
  }, [student._id])

  const attendanceSummary = useMemo(() => {
    const total = attendance.length
    const present = attendance.filter((r) => r.status === 'present').length
    const absent = attendance.filter((r) => r.status === 'absent').length
    const late = attendance.filter((r) => r.status === 'late').length
    const pct = total > 0 ? Math.round((present / total) * 100) : null
    return { total, present, absent, late, pct }
  }, [attendance])

  const recentGrades = useMemo(() =>
    [...grades].sort((a, b) => b.term.localeCompare(a.term)).slice(0, 6),
    [grades]
  )

  const cgpa = useMemo(() => {
    const GRADE_POINT: Record<string, number> = { 'A+': 10, A: 9, 'B+': 8, B: 7, C: 6, D: 5, F: 0 }
    if (!grades.length) return null
    const sum = grades.reduce((s, g) => s + (GRADE_POINT[g.grade] ?? 0), 0)
    return (sum / grades.length).toFixed(2)
  }, [grades])

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 dark:bg-black/60 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Student Details</h2>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>Edit</Button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar + basic info */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-2xl shrink-0">
              {student.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{student.name}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">Roll: {student.rollNo}</p>
              <Badge variant="info" className="mt-1">{student.class}</Badge>
            </div>
          </div>

          {/* Contact info */}
          <div className="rounded-xl border border-gray-100 dark:border-slate-800 divide-y divide-gray-100 dark:divide-slate-800">
            {[
              { label: 'Email', value: student.email || '—', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
              { label: 'Phone', value: student.phone || '—', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
              { label: 'Parent', value: student.parentName || '—', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
              { label: 'Parent Phone', value: student.parentPhone || '—', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3">
                <svg className="h-4 w-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                <span className="text-xs text-gray-400 w-20 shrink-0">{label}</span>
                <span className="text-sm text-gray-700 dark:text-slate-200 truncate">{value}</span>
              </div>
            ))}
          </div>

          {loadingDetails ? (
            <TableSkeleton rows={3} />
          ) : (
            <>
              {/* Attendance summary */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">Attendance Summary</h4>
                {attendanceSummary.total === 0 ? (
                  <p className="text-xs text-gray-400">No attendance records found.</p>
                ) : (
                  <>
                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 h-2.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            (attendanceSummary.pct ?? 0) >= 75 ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${attendanceSummary.pct ?? 0}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold shrink-0 ${
                        (attendanceSummary.pct ?? 0) >= 75 ? 'text-emerald-600' : 'text-red-500'
                      }`}>
                        {attendanceSummary.pct}%
                      </span>
                    </div>
                    {(attendanceSummary.pct ?? 0) < 75 && (
                      <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Below 75% attendance threshold
                      </p>
                    )}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: 'Present', value: attendanceSummary.present, color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Absent', value: attendanceSummary.absent, color: 'text-red-500' },
                        { label: 'Late', value: attendanceSummary.late, color: 'text-amber-500' },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-xl bg-gray-50 dark:bg-slate-800 py-3">
                          <p className={`text-xl font-bold ${color}`}>{value}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Grades */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200">Grades</h4>
                  {cgpa && (
                    <span className="text-xs text-gray-500 dark:text-slate-400">
                      CGPA: <span className="font-bold text-indigo-600 dark:text-indigo-400">{cgpa}</span>
                    </span>
                  )}
                </div>
                {recentGrades.length === 0 ? (
                  <p className="text-xs text-gray-400">No grades recorded.</p>
                ) : (
                  <div className="space-y-2">
                    {recentGrades.map((g) => (
                      <div key={g._id} className="flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-slate-800 px-4 py-2.5">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-700 dark:text-slate-200 truncate">{g.subject}</p>
                          <p className="text-xs text-gray-400">{g.term}</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-700 dark:text-slate-200 shrink-0">
                          {g.marks}/{g.maxMarks}
                        </span>
                        <Badge variant={GRADE_COLOR[g.grade] ?? 'default'} className="shrink-0">{g.grade}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export function StudentsClient() {
  const { toast } = useToast()
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [drawerStudent, setDrawerStudent] = useState<Student | null>(null)
  const [groupByClass, setGroupByClass] = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormData>()

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1) }, 400)
    return () => clearTimeout(t)
  }, [search])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '15' })
      if (debouncedSearch) params.set('search', debouncedSearch)
      const res = await fetch(`/api/students?${params}`)
      const data = await res.json()
      setStudents(data.students ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 1)
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  // Group students by class
  const grouped = useMemo(() => {
    if (!groupByClass) return null
    const map: Record<string, Student[]> = {}
    for (const s of students) (map[s.class] ??= []).push(s)
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [students, groupByClass])

  const openAdd = () => { setEditing(null); reset({}); setModalOpen(true) }
  const openEdit = (s: Student) => {
    setEditing(s)
    reset({ name: s.name, rollNo: s.rollNo, class: s.class, email: s.email, phone: s.phone, parentName: s.parentName, parentPhone: s.parentPhone })
    setModalOpen(true)
  }

  const openDrawer = (s: Student) => setDrawerStudent(s)

  const onSubmit = async (data: FormData) => {
    const url = editing ? `/api/students/${editing._id}` : '/api/students'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) {
      toast(editing ? 'Student updated!' : 'Student added!', 'success')
      setModalOpen(false)
      fetchStudents()
    } else {
      let msg = 'Something went wrong'
      try {
        const err = await res.json()
        if (typeof err.error === 'string') msg = err.error
        else if (err.error?.fieldErrors) {
          const first = Object.values(err.error.fieldErrors as Record<string, string[]>)[0]
          if (first?.[0]) msg = first[0]
        }
      } catch { msg = `Error: ${res.status}` }
      toast(msg, 'error')
    }
  }

  const deleteStudent = async (id: string) => {
    setDeleting(id)
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) { toast('Student deleted', 'success'); fetchStudents() }
    else toast('Failed to delete', 'error')
  }

  function StudentRow({ s }: { s: Student }) {
    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
        <td className="px-4 py-3">
          <button
            className="flex items-center gap-3 text-left group"
            onClick={() => openDrawer(s)}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-sm shrink-0">
              {s.name.charAt(0).toUpperCase()}
            </div>
            <span className="font-medium text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {s.name}
            </span>
          </button>
        </td>
        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.rollNo}</td>
        <td className="px-4 py-3"><Badge variant="info">{s.class}</Badge></td>
        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.phone || s.email || '—'}</td>
        <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.parentName || '—'}</td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting === s._id}
              onClick={() => { if (confirm('Delete this student?')) deleteStudent(s._id) }}
            >
              Delete
            </Button>
          </div>
        </td>
      </tr>
    )
  }

  const tableHead = (
    <thead className="bg-gray-50 dark:bg-slate-900/50">
      <tr>
        {['Student', 'Roll No', 'Class', 'Contact', 'Parent', 'Actions'].map((h) => (
          <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{h}</th>
        ))}
      </tr>
    </thead>
  )

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-sm relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search students…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGroupByClass((v) => !v)}
            className={`px-3 py-2 text-sm rounded-xl border transition-colors ${
              groupByClass
                ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400'
                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            Group by Class
          </button>
          <Button onClick={openAdd}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Student
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
          <span className="text-sm font-medium text-gray-700 dark:text-slate-200">
            {total} student{total !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-6"><TableSkeleton rows={6} /></div>
        ) : students.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-gray-400 text-sm">No students found.</p>
            <Button className="mt-4" size="sm" onClick={openAdd}>Add your first student</Button>
          </div>
        ) : groupByClass && grouped ? (
          /* Grouped view */
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {grouped.map(([cls, classStudents]) => (
              <div key={cls}>
                <div className="px-6 py-2.5 bg-gray-50 dark:bg-slate-900/40 flex items-center gap-2">
                  <Badge variant="info">{cls}</Badge>
                  <span className="text-xs text-gray-500 dark:text-slate-400">{classStudents.length} student{classStudents.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    {tableHead}
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                      {classStudents.map((s) => <StudentRow key={s._id} s={s} />)}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Flat view */
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {tableHead}
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {students.map((s) => <StudentRow key={s._id} s={s} />)}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-700">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span className="text-sm text-gray-500 dark:text-slate-400">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* Student detail drawer */}
      {drawerStudent && (
        <StudentDrawer
          student={drawerStudent}
          onClose={() => setDrawerStudent(null)}
          onEdit={() => { openEdit(drawerStudent); setDrawerStudent(null) }}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Student' : 'Add Student'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name *</label>
              <input {...register('name', { required: true })} className="input w-full" placeholder="John Doe" />
              {errors.name && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Roll No *</label>
              <input {...register('rollNo', { required: true })} className="input w-full" placeholder="CS-001" />
              {errors.rollNo && <p className="text-xs text-red-500 mt-1">Required</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Class *</label>
            <input {...register('class', { required: true })} className="input w-full" placeholder="B.Tech 3rd Year - A" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Email</label>
              <input {...register('email')} type="email" className="input w-full" placeholder="student@email.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone</label>
              <input {...register('phone')} className="input w-full" placeholder="+91 9876543210" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Parent Name</label>
              <input {...register('parentName')} className="input w-full" placeholder="Parent's name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Parent Phone</label>
              <input {...register('parentPhone')} className="input w-full" placeholder="+91 9876543210" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting} type="submit">{editing ? 'Update' : 'Add Student'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
