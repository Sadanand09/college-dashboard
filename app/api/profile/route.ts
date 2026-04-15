import { auth, currentUser } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Teacher } from '@/models/Teacher'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  let teacher = await Teacher.findOne({ clerkId: userId }).lean()

  if (!teacher) {
    const clerkUser = await currentUser()
    teacher = await Teacher.create({
      clerkId: userId,
      name: clerkUser?.fullName ?? '',
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? '',
      department: '',
      subjects: [],
    })
    teacher = teacher.toObject()
  }

  return NextResponse.json(teacher)
}

export async function PUT(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()
    
    let body
    try {
      body = await req.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }
    
    const { name, department, subjects, phone, bio } = body
    
    // Validate input
    if (typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name must be a non-empty string' }, { status: 400 })
    }
    if (typeof department !== 'string' || !department.trim()) {
      return NextResponse.json({ error: 'department must be a non-empty string' }, { status: 400 })
    }
    if (!Array.isArray(subjects) || !subjects.every((s) => typeof s === 'string')) {
      return NextResponse.json({ error: 'subjects must be an array of strings' }, { status: 400 })
    }
    if (phone !== undefined && typeof phone !== 'string') {
      return NextResponse.json({ error: 'phone must be a string' }, { status: 400 })
    }
    if (bio !== undefined && typeof bio !== 'string') {
      return NextResponse.json({ error: 'bio must be a string' }, { status: 400 })
    }

    const teacher = await Teacher.findOneAndUpdate(
      { clerkId: userId },
      { $set: { name, department, subjects, phone, bio } },
      { new: true }
    )
    
    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    return NextResponse.json(teacher)
  } catch (error) {
    if (error instanceof Error) {
      console.error('PUT /api/profile error:', error.message)
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
