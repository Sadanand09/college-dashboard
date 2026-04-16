'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'

interface Assignment {
  _id: string
  title: string
  description: string
  subject: string
  class: string
  deadline: string
  status: 'active' | 'closed'
  kanbanStatus: 'todo' | 'in_progress' | 'submitted'
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

type KanbanCol = 'todo' | 'in_progress' | 'submitted'

const COLUMNS: { id: KanbanCol; title: string; accent: string; header: string }[] = [
  {
    id: 'todo',
    title: 'To Do',
    accent: 'border-t-blue-500',
    header: 'bg-blue-50 dark:bg-blue-900/10',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    accent: 'border-t-amber-500',
    header: 'bg-amber-50 dark:bg-amber-900/10',
  },
  {
    id: 'submitted',
    title: 'Submitted',
    accent: 'border-t-emerald-500',
    header: 'bg-emerald-50 dark:bg-emerald-900/10',
  },
]

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'default'> = {
  active: 'success',
  closed: 'default',
}

function daysUntil(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function AssignmentsClient() {
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Assignment | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOverCol, setDragOverCol] = useState<KanbanCol | null>(null)
  const draggingRef = useRef<string | null>(null)

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormData>()

  const fetchAssignments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/assignments?limit=100')
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)
      const data = await res.json()
      const raw: Assignment[] = Array.isArray(data.assignments)
        ? data.assignments
        : Array.isArray(data) ? data : []
      // Back-fill kanbanStatus for existing records without it
      setAssignments(raw.map((a) => ({
        ...a,
        kanbanStatus: a.kanbanStatus ?? (a.status === 'closed' ? 'submitted' : 'todo'),
      })))
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Failed to load', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

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
        toast('Failed to save', 'error')
      }
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Network error', 'error')
    }
  }

  const moveCard = async (id: string, col: KanbanCol) => {
    // Optimistic update
    setAssignments((prev) =>
      prev.map((a) =>
        a._id === id
          ? { ...a, kanbanStatus: col, status: col === 'submitted' ? 'closed' : 'active' }
          : a
      )
    )
    try {
      await fetch(`/api/assignments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kanbanStatus: col,
          status: col === 'submitted' ? 'closed' : 'active',
        }),
      })
    } catch {
      fetchAssignments() // revert on error
    }
  }

  const deleteAssignment = async (id: string) => {
    try {
      const res = await fetch(`/api/assignments/${id}`, { method: 'DELETE' })
      if (res.ok) { toast('Deleted', 'success'); fetchAssignments() }
      else toast('Failed to delete', 'error')
    } catch (error) {
      toast(error instanceof Error ? error.message : 'Network error', 'error')
    }
  }

  // Drag handlers
  const onDragStart = (e: React.DragEvent, id: string) => {
    draggingRef.current = id
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragEnd = () => {
    setDragId(null)
    setDragOverCol(null)
    draggingRef.current = null
  }

  const onDragOver = (e: React.DragEvent, col: KanbanCol) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(col)
  }

  const onDrop = (e: React.DragEvent, col: KanbanCol) => {
    e.preventDefault()
    const id = draggingRef.current
    if (id) {
      const a = assignments.find((x) => x._id === id)
      if (a && a.kanbanStatus !== col) moveCard(id, col)
    }
    setDragId(null)
    setDragOverCol(null)
  }

  const columnAssignments = (col: KanbanCol) =>
    assignments.filter((a) => (a.kanbanStatus ?? 'todo') === col)

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-h-100">
        {COLUMNS.map((col) => (
          <div key={col.id} className={`rounded-2xl border-t-4 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 animate-pulse ${col.accent}`}>
            <div className="h-5 w-24 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl bg-gray-100 dark:bg-slate-700/50 p-4 mb-3 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-slate-600 rounded w-3/4" />
                <div className="h-3 bg-gray-200 dark:bg-slate-600 rounded w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Drag cards between columns to update status
        </p>
        <Button onClick={openAdd}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Assignment
        </Button>
      </div>

      {/* Kanban columns */}
      {assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 py-20 text-center">
          <p className="text-gray-400 text-sm mb-4">No assignments yet.</p>
          <Button size="sm" onClick={openAdd}>Create first assignment</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          {COLUMNS.map((col) => {
            const cards = columnAssignments(col.id)
            const isDragTarget = dragOverCol === col.id

            return (
              <div
                key={col.id}
                onDragOver={(e) => onDragOver(e, col.id)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={(e) => onDrop(e, col.id)}
                className={`rounded-2xl border-t-4 border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-all ${col.accent} ${
                  isDragTarget ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 shadow-lg' : ''
                }`}
              >
                {/* Column header */}
                <div className={`px-4 py-3 flex items-center justify-between rounded-t-xl ${col.header}`}>
                  <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">{col.title}</span>
                  <span className="text-xs font-medium bg-white/80 dark:bg-slate-700/80 text-gray-600 dark:text-slate-300 rounded-full px-2 py-0.5">
                    {cards.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="p-3 space-y-3 min-h-30">
                  {cards.length === 0 && (
                    <div className={`flex items-center justify-center h-20 rounded-xl border-2 border-dashed text-xs text-gray-400 dark:text-slate-500 transition-colors ${
                      isDragTarget ? 'border-indigo-400 text-indigo-400' : 'border-gray-200 dark:border-slate-700'
                    }`}>
                      Drop here
                    </div>
                  )}
                  {cards.map((a) => {
                    const days = daysUntil(a.deadline)
                    const isDragging = dragId === a._id
                    return (
                      <div
                        key={a._id}
                        draggable
                        onDragStart={(e) => onDragStart(e, a._id)}
                        onDragEnd={onDragEnd}
                        className={`rounded-xl border border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing select-none transition-all ${
                          isDragging ? 'opacity-50 scale-95 rotate-1' : 'opacity-100'
                        }`}
                      >
                        {/* Card header */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{a.title}</h3>
                          <Badge variant={STATUS_BADGE[a.status]} className="shrink-0 capitalize text-xs">
                            {a.status}
                          </Badge>
                        </div>

                        {a.description && (
                          <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 mb-2">{a.description}</p>
                        )}

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <Badge variant="info" className="text-xs">{a.subject}</Badge>
                          <Badge variant="default" className="text-xs">{a.class}</Badge>
                          <Badge variant="purple" className="text-xs">{a.maxMarks}m</Badge>
                        </div>

                        <div className={`text-xs font-medium mb-3 ${
                          days < 0 ? 'text-red-500' : days <= 2 ? 'text-amber-500' : 'text-gray-400 dark:text-slate-500'
                        }`}>
                          {days >= 0 ? `Due in ${days}d — ${a.deadline}` : `Overdue — ${a.deadline}`}
                        </div>

                        {/* Card actions */}
                        <div className="flex gap-1.5 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                          <button
                            onClick={() => openEdit(a)}
                            className="flex-1 text-xs py-1 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            Edit
                          </button>
                          {/* Quick column switcher */}
                          {COLUMNS.filter((c) => c.id !== col.id).map((c) => (
                            <button
                              key={c.id}
                              onClick={() => moveCard(a._id, c.id)}
                              className="flex-1 text-xs py-1 rounded-lg text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors truncate"
                              title={`Move to ${c.title}`}
                            >
                              → {c.title}
                            </button>
                          ))}
                          <button
                            onClick={() => { if (confirm('Delete?')) deleteAssignment(a._id) }}
                            className="text-xs py-1 px-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  })}
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
            {errors.title && <p className="mt-1 text-xs text-red-500">Required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className="input w-full resize-none" placeholder="Instructions…" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subject *</label>
              <input {...register('subject', { required: true })} className="input w-full" placeholder="Mathematics" />
              {errors.subject && <p className="mt-1 text-xs text-red-500">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Class *</label>
              <input {...register('class', { required: true })} className="input w-full" placeholder="B.Tech 3rd - A" />
              {errors.class && <p className="mt-1 text-xs text-red-500">Required</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Deadline *</label>
              <input {...register('deadline', { required: true })} type="date" className="input w-full" />
              {errors.deadline && <p className="mt-1 text-xs text-red-500">Required</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Max Marks</label>
              <input {...register('maxMarks', { valueAsNumber: true })} type="number" min="1" className="input w-full" defaultValue={100} />
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
