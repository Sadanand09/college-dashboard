import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Attendance } from '@/models/Attendance'
import { z } from 'zod'

const AttendanceSchema = z.object({
  studentId: z.string().min(1),
  studentName: z.string().min(1),
  class: z.string().min(1),
  date: z.string().min(1),
  status: z.enum(['present', 'absent', 'late']),
})

const BulkSchema = z.array(AttendanceSchema)

export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const cls = searchParams.get('class')

  const query: Record<string, unknown> = { teacherId: userId }
  if (date) query.date = date
  if (cls) query.class = cls

  const records = await Attendance.find(query).sort({ date: -1, studentName: 1 }).lean()
  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await connectDB()

    let body
    try {
      body = await req.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Support both single and bulk
    const isBulk = Array.isArray(body)
    const parsed = isBulk ? BulkSchema.safeParse(body) : AttendanceSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

    if (isBulk) {
      const ops = (parsed.data as z.infer<typeof BulkSchema>).map((record) => ({
        updateOne: {
          filter: { teacherId: userId, studentId: record.studentId, date: record.date },
          update: { $set: { ...record, teacherId: userId } },
          upsert: true,
        },
      }))
      await Attendance.bulkWrite(ops)
      return NextResponse.json({ success: true, count: ops.length })
    } else {
      const record = await Attendance.findOneAndUpdate(
        { teacherId: userId, studentId: (parsed.data as z.infer<typeof AttendanceSchema>).studentId, date: (parsed.data as z.infer<typeof AttendanceSchema>).date },
        { $set: { ...(parsed.data as z.infer<typeof AttendanceSchema>), teacherId: userId } },
        { upsert: true, new: true }
      )
      return NextResponse.json(record, { status: 201 })
    }
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
