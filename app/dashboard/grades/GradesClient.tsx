'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

interface Grade {
  _id: string
  studentId: string
  studentName: string
  subject: string
  marks: number
  maxMarks: number
  grade: string
  term: string
}

interface Student {
  _id: string
  name: string
  rollNo: string
  class: string
}

interface FormData {
  studentId: string
  subject: string
  marks: number
  maxMarks: number
  term: string
}

const GRADE_COLOR: Record<string, string> = {
  'A+': 'success',
  'A': 'success',
  'B+': 'info',
  'B': 'info',
  'C': 'warning',
  'D': 'warning',
  'F': 'danger',
}

export function GradesClient() {
  const { toast } = useToast()
  const [grades, setGrades] = useState<Grade[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Grade | null>(null)
  const [subjectFilter, setSubjectFilter] = useState('')

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormData>()

  const fetchGrades = useCallback(async () => {
    setLoading(true)
    try {
      const params = subjectFilter ? `?subject=${encodeURIComponent(subjectFilter)}` : ''
      const gradesRes = await fetch(`/api/grades${params}`)
      const studentsRes = await fetch('/api/students?limit=200')
      
      if (!gradesRes.ok) {
        throw new Error(`Failed to fetch grades: ${gradesRes.status}`)
      }
      if (!studentsRes.ok) {
        throw new Error(`Failed to fetch students: ${studentsRes.status}`)
      }
      
      const gradesData = await gradesRes.json()
      const studentsData = await studentsRes.json()
      
      setGrades(Array.isArray(gradesData) ? gradesData : [])
      setStudents(studentsData.students ?? [])
    } catch (error) {
      console.error('fetchGrades error:', error)
      setGrades([])
      setStudents([])
    } finally {
      setLoading(false)
    }
  }, [subjectFilter])

  useEffect(() => { fetchGrades() }, [fetchGrades])

  const openAdd = () => {
    setEditing(null)
    reset({ maxMarks: 100, term: 'Term 1' })
    setModalOpen(true)
  }

  const openEdit = (g: Grade) => {
    setEditing(g)
    reset({ studentId: g.studentId, subject: g.subject, marks: g.marks, maxMarks: g.maxMarks, term: g.term })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    const selectedStudent = students.find((s) => s._id === data.studentId)
    const payload = { ...data, marks: Number(data.marks), maxMarks: Number(data.maxMarks), studentName: selectedStudent?.name ?? '' }
    const url = editing ? `/api/grades/${editing._id}` : '/api/grades'
    const method = editing ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast(editing ? 'Grade updated!' : 'Grade added!', 'success')
        setModalOpen(false)
        fetchGrades()
      } else {
        toast('Failed to save grade', 'error')
      }
    } catch (error) {
      console.error('onSubmit error:', error)
      toast(error instanceof Error ? error.message : 'Network error saving grade', 'error')
    }
  }

  const deleteGrade = async (id: string) => {
    try {
      const res = await fetch(`/api/grades/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast('Grade deleted', 'success')
        fetchGrades()
      } else {
        toast('Failed to delete grade', 'error')
      }
    } catch (error) {
      console.error('deleteGrade error:', error)
      toast(error instanceof Error ? error.message : 'Network error', 'error')
    }
  }

  // Grade distribution for chart
  const gradeDistribution = ['A+', 'A', 'B+', 'B', 'C', 'D', 'F'].map((g) => ({
    grade: g,
    count: grades.filter((r) => r.grade === g).length,
  })).filter((r) => r.count > 0)

  // Average per subject
  const subjectAverages: Record<string, { total: number; count: number }> = {}
  for (const g of grades) {
    if (g.maxMarks > 0) {
      if (!subjectAverages[g.subject]) subjectAverages[g.subject] = { total: 0, count: 0 }
      subjectAverages[g.subject].total += (g.marks / g.maxMarks) * 100
      subjectAverages[g.subject].count++
    }
  }
  const subjectData = Object.entries(subjectAverages).map(([subject, v]) => ({
    subject: subject.slice(0, 12),
    avg: v.count > 0 ? Math.round(v.total / v.count) : 0,
  }))

  return (
    <div className="space-y-6">
      {/* Charts */}
      {grades.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Grade Distribution</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="grade" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-4">Average Score by Subject (%)</h2>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="subject" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="avg" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <input
            type="text"
            placeholder="Filter by subject…"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="input max-w-xs"
          />
          <Button onClick={openAdd}>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Grade
          </Button>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
          {loading ? (
            <div className="p-6"><TableSkeleton rows={6} /></div>
          ) : grades.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-gray-400 text-sm">No grades recorded yet.</p>
              <Button size="sm" className="mt-4" onClick={openAdd}>Add first grade</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-900/50">
                  <tr>
                    {['Student', 'Subject', 'Marks', 'Grade', 'Term', 'Actions'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                  {grades.map((g) => (
                    <tr key={g._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{g.studentName}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{g.subject}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-gray-900 dark:text-white">{g.marks}</span>
                        <span className="text-gray-400">/{g.maxMarks}</span>
                        <span className="ml-1 text-xs text-gray-400">({g.maxMarks > 0 ? Math.round((g.marks / g.maxMarks) * 100) : 'N/A'}%)</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(GRADE_COLOR[g.grade] as 'success' | 'info' | 'warning' | 'danger') ?? 'default'}>
                          {g.grade}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-slate-400">{g.term}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(g)}>Edit</Button>
                          <Button size="sm" variant="danger" onClick={() => { if (confirm('Delete?')) deleteGrade(g._id) }}>Delete</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Grade' : 'Add Grade'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Student *</label>
            <select {...register('studentId', { required: true })} className="input w-full">
              <option value="">Select student…</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>{s.name} ({s.rollNo})</option>
              ))}
            </select>
            {errors.studentId && <p className="text-xs text-red-500 mt-1">Required</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subject *</label>
              <input {...register('subject', { required: true })} className="input w-full" placeholder="Mathematics" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Term</label>
              <input {...register('term')} className="input w-full" placeholder="Term 1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Marks *</label>
              <input {...register('marks', { required: true, min: 0, valueAsNumber: true })} type="number" className="input w-full" placeholder="85" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Max Marks</label>
              <input {...register('maxMarks', { valueAsNumber: true, min: 1 })} type="number" min="1" className="input w-full" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting} type="submit">{editing ? 'Update' : 'Add Grade'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
