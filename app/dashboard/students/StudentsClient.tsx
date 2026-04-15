'use client'

import { useEffect, useState, useCallback } from 'react'
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

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormData>()

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400)
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

  const openAdd = () => { setEditing(null); reset({}); setModalOpen(true) }
  const openEdit = (s: Student) => {
    setEditing(s)
    reset({ name: s.name, rollNo: s.rollNo, class: s.class, email: s.email, phone: s.phone, parentName: s.parentName, parentPhone: s.parentPhone })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    const url = editing ? `/api/students/${editing._id}` : '/api/students'
    const method = editing ? 'PUT' : 'POST'
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (res.ok) {
      toast(editing ? 'Student updated!' : 'Student added!', 'success')
      setModalOpen(false)
      fetchStudents()
    } else {
      const err = await res.json()
      toast(err.error?.formErrors?.[0] ?? 'Something went wrong', 'error')
    }
  }

  const deleteStudent = async (id: string) => {
    setDeleting(id)
    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (res.ok) { toast('Student deleted', 'success'); fetchStudents() }
    else toast('Failed to delete', 'error')
  }

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
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <Button onClick={openAdd}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Student
        </Button>
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-slate-900/50">
                <tr>
                  {['Student', 'Roll No', 'Class', 'Contact', 'Parent', 'Actions'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-semibold text-sm flex-shrink-0">
                          {s.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-slate-300">{s.rollNo}</td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{s.class}</Badge>
                    </td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-slate-700">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
            <span className="text-sm text-gray-500 dark:text-slate-400">Page {page} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
          </div>
        )}
      </div>

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
