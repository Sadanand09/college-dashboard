'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useUser } from '@clerk/nextjs'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { CardSkeleton } from '@/components/ui/Skeleton'

interface TeacherProfile {
  name: string
  email: string
  department: string
  subjects: string[]
  phone: string
  bio: string
}

interface FormData {
  name: string
  department: string
  subjectsRaw: string
  phone: string
  bio: string
}

export function ProfileClient() {
  const { user } = useUser()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<TeacherProfile | null>(null)
  const [editing, setEditing] = useState(false)

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>()

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const res = await fetch('/api/profile')
        const data = await res.json()
        setProfile(data)
        reset({
          name: data.name,
          department: data.department,
          subjectsRaw: (data.subjects ?? []).join(', '),
          phone: data.phone,
          bio: data.bio,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [reset])

  const onSubmit = async (data: FormData) => {
    const subjects = data.subjectsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name, department: data.department, subjects, phone: data.phone, bio: data.bio }),
    })
    if (res.ok) {
      const updated = await res.json()
      setProfile(updated)
      toast('Profile updated!', 'success')
      setEditing(false)
    } else toast('Failed to update profile', 'error')
  }

  if (loading) {
    return (
      <div className="max-w-2xl space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Avatar + Clerk info card */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <div className="flex items-center gap-5">
          {user?.imageUrl ? (
            <img
              src={user.imageUrl}
              alt={user.fullName ?? 'Teacher'}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-indigo-200 dark:ring-indigo-800"
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-2xl">
              {(profile?.name ?? 'T').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{profile?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{profile?.email}</p>
            {profile?.department && (
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">{profile.department}</p>
            )}
          </div>
        </div>

        {profile?.subjects && profile.subjects.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {profile.subjects.map((s) => (
              <span key={s} className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Edit form */}
      <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Profile Details</h3>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </Button>
          )}
        </div>

        {editing ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Full Name</label>
                <input {...register('name')} className="input w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Phone</label>
                <input {...register('phone')} className="input w-full" placeholder="+91 9876543210" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Department</label>
              <input {...register('department')} className="input w-full" placeholder="Computer Science & Engineering" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Subjects (comma-separated)</label>
              <input {...register('subjectsRaw')} className="input w-full" placeholder="Mathematics, Physics, Programming" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Bio</label>
              <textarea {...register('bio')} rows={4} className="input w-full resize-none" placeholder="Write something about yourself…" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" type="button" onClick={() => setEditing(false)}>Cancel</Button>
              <Button loading={isSubmitting} type="submit">Save Changes</Button>
            </div>
          </form>
        ) : (
          <dl className="space-y-4">
            {[
              { label: 'Full Name', value: profile?.name },
              { label: 'Email', value: profile?.email },
              { label: 'Phone', value: profile?.phone || '—' },
              { label: 'Department', value: profile?.department || '—' },
              { label: 'Subjects', value: profile?.subjects?.join(', ') || '—' },
              { label: 'Bio', value: profile?.bio || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="flex gap-4">
                <dt className="w-32 flex-shrink-0 text-sm text-gray-500 dark:text-slate-400">{label}</dt>
                <dd className="text-sm text-gray-900 dark:text-white flex-1">{value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  )
}
