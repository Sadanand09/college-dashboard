'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'

interface Assignment {
  _id: string
  title: string
  description: string
  subject: string
  class: string
  deadline: string
  status: 'active' | 'closed'
  maxMarks: number
  createdAt: string
}

interface FormData {
  title: string
  description: string
  subject: string
  class: string
  deadline: string
  maxMarks: number
}

export function AssignmentsClient() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'closed'>('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormData>()

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const params = filter !== 'all' ? `?status=${filter}` : ''
      const res = await fetch(`/api/assignments${params}`)
      if (!res.ok) {
        throw new Error(`Failed to fetch assignments: ${res.status}`)
      }
      const data = await res.json()
      setAssignments(Array.isArray(data.assignments) ? data.assignments : Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('fetchAssignments error:', error)
      setAssignments([])
      if (error instanceof Error) {
        toast(error.message, 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [filter, toast])

  useEffect(() => { fetchAssignments() }, [fetchAssignments])

  const openAdd = () => {
    setEditing(null)
    reset({ maxMarks: 100 })
    setModalOpen(true)
  }

  const openEdit = (a: Assignment) => {
    setEditing(a)
    reset({ title: a.title, description: a.description, subject: a.subject, class: a.class, deadline: a.deadline, maxMarks: a.maxMarks })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    const url = editing ? `/api/assignments/${editing._id}` : '/api/assignments'
    const method = editing ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, maxMarks: Number(data.maxMarks) }),
      })
      if (res.ok) {
        toast(editing ? 'Assignment updated!' : 'Assignment created!', 'success')
        setModalOpen(false)
        fetchAssignments()
      } else {
        toast('Failed to save assignment', 'error')
      }
    } catch (error) {
      console.error('onSubmit error:', error)
      toast(error instanceof Error ? error.message : 'Network error saving assignment', 'error')
    }
  }

  const toggleStatus = async (a: Assignment) => {
    const newStatus = a.status === 'active' ? 'closed' : 'active'
    try {
      const res = await fetch(`/api/assignments/${a._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        toast(`Assignment marked as ${newStatus}`, 'success')
        fetchAssignments()
      } else {
        toast('Failed to update assignment', 'error')
      }
    } catch (error) {
      console.error('toggleStatus error:', error)
      toast(error instanceof Error ? error.message : 'Network error', 'error')
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast('Assignment deleted', 'success')
        fetchAssignments()
      } else {
        toast('Failed to delete assignment', 'error')
      }
    } catch (error) {
      console.error('deleteAssignment error:', error)
      toast(error instanceof Error ? error.message : 'Network error', 'error')
    }
  }

  const daysUntil = (deadline: string) => {
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return diff
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1 rounded-xl bg-gray-100 dark:bg-slate-800 p-1">
          {(['all', 'active', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg capitalize transition-colors ${
                filter === f
                  ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <Button onClick={openAdd}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Assignment
        </Button>
      </div>

      {/* Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5">
              <TableSkeleton rows={3} />
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 py-20 text-center">
          <p className="text-gray-400 text-sm mb-4">No assignments yet.</p>
          <Button size="sm" onClick={openAdd}>Create first assignment</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {assignments.map((a) => {
            const days = daysUntil(a.deadline)
            return (
              <div key={a._id} className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">{a.title}</h3>
                  <Badge variant={a.status === 'active' ? 'success' : 'default'} className="flex-shrink-0 capitalize">
                    {a.status}
                  </Badge>
                </div>
                {a.description && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2">{a.description}</p>
                )}
                <div className="flex flex-wrap gap-2 text-xs">
                  <Badge variant="info">{a.subject}</Badge>
                  <Badge variant="default">{a.class}</Badge>
                  <Badge variant="purple">{a.maxMarks} marks</Badge>
                </div>
                <div className={`text-xs font-medium ${days < 0 ? 'text-red-500' : days <= 2 ? 'text-amber-500' : 'text-gray-500 dark:text-slate-400'}`}>
                  Deadline: {a.deadline}
                  {days >= 0 ? ` (${days}d left)` : ' (overdue)'}
                </div>
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100 dark:border-slate-700">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>Edit</Button>
                  <Button size="sm" variant="secondary" onClick={() => toggleStatus(a)}>
                    {a.status === 'active' ? 'Close' : 'Reopen'}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => { if (confirm('Delete this assignment?')) deleteAssignment(a._id) }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Assignment' : 'Create Assignment'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title *</label>
            <input {...register('title', { required: true })} className="input w-full" placeholder="Assignment title" />
            {errors.title && <p className="text-xs text-red-500 mt-1">Required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="input w-full resize-none" placeholder="Instructions for students…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subject *</label>
              <input {...register('subject', { required: true })} className="input w-full" placeholder="Mathematics" />
              {errors.subject && <p className="mt-1 text-xs text-red-500">Subject is required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Class *</label>
              <input {...register('class', { required: true })} className="input w-full" placeholder="B.Tech 3rd - A" />
              {errors.class && <p className="mt-1 text-xs text-red-500">Class is required</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Deadline *</label>
              <input {...register('deadline', { required: true })} type="date" className="input w-full" />
              {errors.deadline && <p className="mt-1 text-xs text-red-500">Deadline is required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Max Marks</label>
              <input {...register('maxMarks', { valueAsNumber: true })} type="number" className="input w-full" defaultValue={100} />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting} type="submit">{editing ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
