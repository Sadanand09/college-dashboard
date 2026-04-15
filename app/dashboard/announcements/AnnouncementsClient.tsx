'use client'

import { useEffect, useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { useToast } from '@/components/ui/Toast'
import { TableSkeleton } from '@/components/ui/Skeleton'

interface Announcement {
  _id: string
  title: string
  content: string
  audience: string
  pinned: boolean
  createdAt: string
}

interface FormData {
  title: string
  content: string
  audience: string
  pinned: boolean
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function AnnouncementsClient() {
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)

  const { register, handleSubmit, reset, formState: { isSubmitting, errors } } = useForm<FormData>()

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/announcements')
      if (!res.ok) {
        throw new Error(`Failed to fetch announcements: ${res.status}`)
      }
      const data = await res.json()
      setAnnouncements(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('fetchAnnouncements error:', error)
      setAnnouncements([])
      if (error instanceof Error) {
        toast(error.message, 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => { fetchAnnouncements() }, [fetchAnnouncements])

  const openAdd = () => {
    setEditing(null)
    reset({ audience: 'All', pinned: false })
    setModalOpen(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    reset({ title: a.title, content: a.content, audience: a.audience, pinned: a.pinned })
    setModalOpen(true)
  }

  const onSubmit = async (data: FormData) => {
    const url = editing ? `/api/announcements/${editing._id}` : '/api/announcements'
    const method = editing ? 'PUT' : 'POST'
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        toast(editing ? 'Announcement updated!' : 'Announcement posted!', 'success')
        setModalOpen(false)
        fetchAnnouncements()
      } else {
        toast('Failed to save announcement', 'error')
      }
    } catch (error) {
      console.error('onSubmit error:', error)
      toast(error instanceof Error ? error.message : 'Network error saving announcement', 'error')
    }
  }

  const togglePin = async (a: Announcement) => {
    try {
      const res = await fetch(`/api/announcements/${a._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !a.pinned }),
      })
      if (res.ok) {
        toast(a.pinned ? 'Unpinned' : 'Pinned!', 'success')
        fetchAnnouncements()
      } else {
        toast('Failed to update announcement', 'error')
      }
    } catch (error) {
      console.error('togglePin error:', error)
      toast(error instanceof Error ? error.message : 'Network error', 'error')
    }
  }

  const deleteAnnouncement = async (id: string) => {
    const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' })
    if (res.ok) { toast('Announcement deleted', 'success'); fetchAnnouncements() }
    else toast('Failed to delete', 'error')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-end">
        <Button onClick={openAdd}>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Announcement
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
          <TableSkeleton rows={4} />
        </div>
      ) : announcements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 py-20 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
          <p className="text-gray-400 text-sm mb-4">No announcements yet.</p>
          <Button size="sm" onClick={openAdd}>Post first announcement</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a._id}
              className={`rounded-2xl border bg-white dark:bg-slate-800 p-5 transition-all ${
                a.pinned
                  ? 'border-indigo-300 dark:border-indigo-700 shadow-sm shadow-indigo-100 dark:shadow-none'
                  : 'border-gray-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {a.pinned && (
                      <span className="text-indigo-500" title="Pinned">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 2L12 6 8 2 4 6l4 4-2 8h12l-2-8 4-4-4-4z" />
                        </svg>
                      </span>
                    )}
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{a.title}</h3>
                    <Badge variant="info" className="text-xs">{a.audience}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-wrap">{a.content}</p>
                  <p className="mt-2 text-xs text-gray-400 dark:text-slate-500">{timeAgo(a.createdAt)}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button
                    onClick={() => togglePin(a)}
                    title={a.pinned ? 'Unpin' : 'Pin'}
                    className={`rounded-lg p-1.5 transition-colors ${
                      a.pinned
                        ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                  <button onClick={() => openEdit(a)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 transition-colors">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => { if (confirm('Delete this announcement?')) deleteAnnouncement(a._id) }}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors"
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Announcement' : 'New Announcement'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Title *</label>
            <input {...register('title', { required: true })} className="input w-full" placeholder="Announcement title" />
            {errors.title && <p className="mt-1 text-xs text-red-500">Title is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Content *</label>
            <textarea {...register('content', { required: true })} rows={4} className="input w-full resize-none" placeholder="Write your announcement…" />
            {errors.content && <p className="mt-1 text-xs text-red-500">Content is required</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Audience</label>
            <input {...register('audience')} className="input w-full" placeholder="All / B.Tech 3rd Year / etc." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input {...register('pinned')} type="checkbox" className="h-4 w-4 rounded accent-indigo-600" />
            <span className="text-sm text-gray-700 dark:text-slate-300">Pin this announcement</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" type="button" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button loading={isSubmitting} type="submit">{editing ? 'Update' : 'Post'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
