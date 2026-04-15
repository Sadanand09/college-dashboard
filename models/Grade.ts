import mongoose, { Schema, model, models } from 'mongoose'

export interface IGrade {
  _id: mongoose.Types.ObjectId
  teacherId: string
  studentId: mongoose.Types.ObjectId
  studentName: string
  subject: string
  marks: number
  maxMarks: number
  grade?: string
  term: string
  createdAt: Date
  updatedAt: Date
}

const GradeSchema = new Schema<IGrade>(
  {
    teacherId: { type: String, required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    studentName: { type: String, required: true },
    subject: { type: String, required: true },
    marks: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator(value: number) {
          return !this.maxMarks || value <= (this.maxMarks as number)
        },
        message: 'marks must be less than or equal to maxMarks',
      },
    },
    maxMarks: { type: Number, default: 100, min: 1 },
    grade: { type: String, default: '' },
    term: { type: String, default: 'Term 1' },
  },
  { timestamps: true }
)

GradeSchema.index({ teacherId: 1, studentId: 1, subject: 1, term: 1 }, { unique: true })

export const Grade = models.Grade ?? model<IGrade>('Grade', GradeSchema)
