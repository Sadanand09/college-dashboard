/**
 * Seed script for college-dashboard MongoDB database.
 *
 * Usage:
 *   node scripts/seed.mjs
 *
 * The script reads MONGODB_URI from .env.local automatically.
 * It seeds data under the first Teacher found in the DB.
 * Sign in once via the app first (which auto-creates your Teacher doc),
 * then run this script.
 *
 * Override which teacher gets seeded:
 *   TEACHER_CLERK_ID=user_xxx node scripts/seed.mjs
 */

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

// ── Load .env.local ────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
try {
  const envFile = readFileSync(envPath, 'utf-8')
  for (const line of envFile.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    let val = trimmed.slice(eqIdx + 1).trim()
    // Strip matching surrounding quotes and unescape common escapes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    val = val.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\'/g, "'")
    if (!process.env[key]) process.env[key] = val
  }
} catch {
  // .env.local not found — rely on process.env
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('❌  MONGODB_URI is not set. Check your .env.local file.')
  process.exit(1)
}

// ── Schemas (mirror the TypeScript models exactly) ─────────────────────────────
const { Schema, model, models, Types } = mongoose

const TeacherSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    department: { type: String, default: '' },
    subjects: { type: [String], default: [] },
    phone: { type: String, default: '' },
    bio: { type: String, default: '' },
  },
  { timestamps: true }
)
const Teacher = models.Teacher ?? model('Teacher', TeacherSchema)

const StudentSchema = new Schema(
  {
    teacherId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    rollNo: { type: String, required: true },
    class: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    parentName: { type: String, default: '' },
    parentPhone: { type: String, default: '' },
  },
  { timestamps: true }
)
StudentSchema.index({ teacherId: 1, rollNo: 1 }, { unique: true })
const Student = models.Student ?? model('Student', StudentSchema)

const AttendanceSchema = new Schema(
  {
    teacherId: { type: String, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    class: { type: String, required: true },
    date: { type: String, required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
  },
  { timestamps: true }
)
AttendanceSchema.index({ teacherId: 1, studentId: 1, date: 1 }, { unique: true })
const Attendance = models.Attendance ?? model('Attendance', AttendanceSchema)

const AssignmentSchema = new Schema(
  {
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    subject: { type: String, required: true },
    class: { type: String, required: true },
    deadline: { type: String, required: true },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
    maxMarks: { type: Number, default: 100 },
  },
  { timestamps: true }
)
const Assignment = models.Assignment ?? model('Assignment', AssignmentSchema)

const GradeSchema = new Schema(
  {
    teacherId: { type: String, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    subject: { type: String, required: true },
    marks: { type: Number, required: true, min: 0 },
    maxMarks: { type: Number, default: 100 },
    grade: { type: String, default: '' },
    term: { type: String, default: 'Term 1' },
  },
  { timestamps: true }
)
GradeSchema.index({ teacherId: 1, studentId: 1, subject: 1, term: 1 }, { unique: true })
const Grade = models.Grade ?? model('Grade', GradeSchema)

const AnnouncementSchema = new Schema(
  {
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    audience: { type: String, default: 'All' },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
)
const Announcement = models.Announcement ?? model('Announcement', AnnouncementSchema)

// ── Helpers ────────────────────────────────────────────────────────────────────
function gradeFromMarks(marks, max = 100) {
  const pct = (marks / max) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  if (pct >= 40) return 'D'
  return 'F'
}

function dateStr(daysFromToday) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromToday)
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

// ── Seed data definitions ──────────────────────────────────────────────────────
const STUDENTS_DATA = [
  { name: 'Aarav Sharma',    rollNo: 'CS001', class: 'CS-A', email: 'aarav@example.com',    phone: '9876543210', parentName: 'Rajesh Sharma',    parentPhone: '9876543200' },
  { name: 'Priya Patel',     rollNo: 'CS002', class: 'CS-A', email: 'priya@example.com',    phone: '9876543211', parentName: 'Suresh Patel',      parentPhone: '9876543201' },
  { name: 'Rohan Mehta',     rollNo: 'CS003', class: 'CS-A', email: 'rohan@example.com',    phone: '9876543212', parentName: 'Vikram Mehta',      parentPhone: '9876543202' },
  { name: 'Ananya Gupta',    rollNo: 'CS004', class: 'CS-A', email: 'ananya@example.com',   phone: '9876543213', parentName: 'Dinesh Gupta',      parentPhone: '9876543203' },
  { name: 'Karthik Reddy',   rollNo: 'CS005', class: 'CS-A', email: 'karthik@example.com',  phone: '9876543214', parentName: 'Venkat Reddy',      parentPhone: '9876543204' },
  { name: 'Divya Nair',      rollNo: 'CS006', class: 'CS-B', email: 'divya@example.com',    phone: '9876543215', parentName: 'Mohan Nair',        parentPhone: '9876543205' },
  { name: 'Arjun Singh',     rollNo: 'CS007', class: 'CS-B', email: 'arjun@example.com',    phone: '9876543216', parentName: 'Balveer Singh',     parentPhone: '9876543206' },
  { name: 'Sneha Iyer',      rollNo: 'CS008', class: 'CS-B', email: 'sneha@example.com',    phone: '9876543217', parentName: 'Ramesh Iyer',       parentPhone: '9876543207' },
  { name: 'Rahul Joshi',     rollNo: 'CS009', class: 'CS-B', email: 'rahul@example.com',    phone: '9876543218', parentName: 'Prakash Joshi',     parentPhone: '9876543208' },
  { name: 'Pooja Agarwal',   rollNo: 'CS010', class: 'CS-B', email: 'pooja@example.com',    phone: '9876543219', parentName: 'Anil Agarwal',      parentPhone: '9876543209' },
]

const SUBJECTS = ['Mathematics', 'Data Structures', 'Operating Systems', 'DBMS', 'Computer Networks']

const ASSIGNMENTS_DATA = [
  { title: 'Binary Tree Traversal',       subject: 'Data Structures',    class: 'CS-A', description: 'Implement in-order, pre-order, and post-order traversals.', deadline: dateStr(7),  status: 'active', maxMarks: 50  },
  { title: 'Calculus Problem Set 3',      subject: 'Mathematics',         class: 'CS-A', description: 'Solve integration and differentiation problems (Ch. 5–6).',  deadline: dateStr(5),  status: 'active', maxMarks: 100 },
  { title: 'Process Scheduling Report',   subject: 'Operating Systems',   class: 'CS-B', description: 'Compare FCFS, SJF, and Round Robin algorithms.',             deadline: dateStr(10), status: 'active', maxMarks: 50  },
  { title: 'ER Diagram – Library System', subject: 'DBMS',                class: 'CS-B', description: 'Design ER diagram and convert to relational schema.',        deadline: dateStr(-2), status: 'closed', maxMarks: 30  },
  { title: 'Socket Programming Lab',      subject: 'Computer Networks',   class: 'CS-A', description: 'Implement a TCP echo server and client in C.',               deadline: dateStr(14), status: 'active', maxMarks: 50  },
  { title: 'Sorting Algorithm Analysis',  subject: 'Data Structures',    class: 'CS-B', description: 'Analyse time and space complexity of 5 sorting algorithms.',  deadline: dateStr(-5), status: 'closed', maxMarks: 100 },
]

const ANNOUNCEMENTS_DATA = [
  { title: 'Mid-term Exam Schedule',      content: 'Mid-term exams are scheduled for 20–25 April 2026. Timetable will be shared on the notice board.',              audience: 'All',  pinned: true  },
  { title: 'Lab Hours Extended',          content: 'Computer lab will be open until 9 PM on weekdays starting this week for project work.',                         audience: 'CS-A', pinned: false },
  { title: 'Guest Lecture: Cloud Basics', content: 'A guest lecture on Cloud Computing fundamentals is scheduled for 18 April 2026 at 11 AM in Seminar Hall.',      audience: 'All',  pinned: false },
  { title: 'Assignment Deadline Reminder',content: 'All pending assignments must be submitted before the mid-term exams begin. No extensions will be granted.',     audience: 'CS-B', pinned: true  },
  { title: 'Sports Day Registration',     content: 'Students wishing to participate in Sports Day 2026 must register at the admin office by 17 April 2026.',        audience: 'All',  pinned: false },
]

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔗  Connecting to MongoDB…')
  await mongoose.connect(MONGODB_URI, { bufferCommands: false })
  console.log('✅  Connected.')

  try {
    // ── Resolve teacher ──────────────────────────────────────────────────────────
    let teacherId = process.env.TEACHER_CLERK_ID

    if (teacherId) {
      console.log(`\nℹ️   Using TEACHER_CLERK_ID from env: ${teacherId}`)
      const exists = await Teacher.exists({ clerkId: teacherId })
      if (!exists) {
        console.log('⚠️   No Teacher found with that clerkId – creating a placeholder record.')
        await Teacher.create({
          clerkId: teacherId,
          name: 'Demo Teacher',
          email: 'demo@college.edu',
          department: 'Computer Science',
          subjects: SUBJECTS,
        })
      }
    } else {
      const teacher = await Teacher.findOne().sort({ createdAt: 1 }).lean()
      if (!teacher) {
        console.error(
          '\n❌  No Teacher document found in the database.\n' +
          '    Sign in to the app once (it auto-creates your Teacher doc via /api/profile),\n' +
          '    then re-run this script.\n' +
          '    Alternatively, pass TEACHER_CLERK_ID=<your_clerk_id> node scripts/seed.mjs'
        )
        process.exit(1)
      }
      teacherId = teacher.clerkId
      console.log(`\nℹ️   Seeding as teacher: "${teacher.name}" (${teacherId})`)
    }

    // ── Clear existing seed data for this teacher ────────────────────────────────
    console.log('\n🧹  Clearing existing data for this teacher…')
    await Promise.all([
      Student.deleteMany({ teacherId }),
      Attendance.deleteMany({ teacherId }),
      Assignment.deleteMany({ teacherId }),
      Grade.deleteMany({ teacherId }),
      Announcement.deleteMany({ teacherId }),
    ])

    // ── Students ─────────────────────────────────────────────────────────────────
    console.log('👨‍🎓  Inserting 10 students…')
    const students = await Student.insertMany(
      STUDENTS_DATA.map(s => ({ ...s, teacherId }))
    )
    console.log(`    ✔ ${students.length} students created.`)

    // ── Attendance (last 7 days for all students) ────────────────────────────────
    console.log('📋  Inserting attendance records (last 7 days)…')
    const statuses = ['present', 'present', 'present', 'present', 'present', 'absent', 'late']
    const attendanceDocs = []
    for (let day = -6; day <= 0; day++) {
      const date = dateStr(day)
      for (const student of students) {
        const status = statuses[Math.floor(Math.random() * statuses.length)]
        attendanceDocs.push({
          teacherId,
          studentId: student._id,
          studentName: student.name,
          class: student.class,
          date,
          status,
        })
      }
    }
    const attendance = await Attendance.insertMany(attendanceDocs)
    console.log(`    ✔ ${attendance.length} attendance records created.`)

    // ── Assignments ───────────────────────────────────────────────────────────────
    console.log('📝  Inserting 6 assignments…')
    const assignments = await Assignment.insertMany(
      ASSIGNMENTS_DATA.map(a => ({ ...a, teacherId }))
    )
    console.log(`    ✔ ${assignments.length} assignments created.`)

    // ── Grades (Term 1 for each student × each subject) ──────────────────────────
    console.log('🎓  Inserting grades…')
    const gradeDocs = []
    const terms = ['Term 1', 'Term 2']
    for (const student of students) {
      for (const subject of SUBJECTS) {
        for (const term of terms) {
          const marks = Math.floor(Math.random() * 41) + 55 // 55–95
          gradeDocs.push({
            teacherId,
            studentId: student._id,
            studentName: student.name,
            subject,
            marks,
            maxMarks: 100,
            grade: gradeFromMarks(marks),
            term,
          })
        }
      }
    }
    const grades = await Grade.insertMany(gradeDocs)
    console.log(`    ✔ ${grades.length} grade records created.`)

    // ── Announcements ─────────────────────────────────────────────────────────────
    console.log('📢  Inserting 5 announcements…')
    const announcements = await Announcement.insertMany(
      ANNOUNCEMENTS_DATA.map(a => ({ ...a, teacherId }))
    )
    console.log(`    ✔ ${announcements.length} announcements created.`)

    // ── Summary ───────────────────────────────────────────────────────────────────
    console.log('\n🌱  Seed complete!')
    console.log(`    Students:      ${students.length}`)
    console.log(`    Attendance:    ${attendance.length}`)
    console.log(`    Assignments:   ${assignments.length}`)
    console.log(`    Grades:        ${grades.length}`)
    console.log(`    Announcements: ${announcements.length}`)
  } finally {
    await mongoose.disconnect()
  }
}

main().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
