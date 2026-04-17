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
    studentId: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    studentName: { type: String, required: true },
    subject: { type: String, required: true },
    marks: {
      type: Number,
      required: true,
      min: 0,
    },
    maxMarks: { type: Number, default: 100, min: 1 },
    grade: { type: String, default: "" },
    term: { type: String, default: "Term 1" },
  },
  { timestamps: true },
);

// Validate marks <= maxMarks on save
GradeSchema.pre("save", function (next) {
  if (
    this.maxMarks !== undefined &&
    this.maxMarks !== null &&
    this.marks > this.maxMarks
  ) {
    next(new Error("marks must be less than or equal to maxMarks"));
  } else {
    next();
  }
});

// Validate marks <= maxMarks on findOneAndUpdate (handles PUT operations)
GradeSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() as Record<string, unknown>;
  if (update && typeof update === "object") {
    const marks = update.marks;
    const maxMarks = update.maxMarks;
    // Only validate if marks is being updated
    if (marks !== undefined && typeof marks === "number") {
      // Use the updated maxMarks if provided, otherwise we can't fully validate without fetching
      // In this case, just ensure marks >= 0 (the schema already has min: 0)
      if (
        maxMarks !== undefined &&
        typeof maxMarks === "number" &&
        marks > maxMarks
      ) {
        next(new Error("marks must be less than or equal to maxMarks"));
      } else {
        next();
      }
    } else {
      next();
    }
  } else {
    next();
  }
});

// Also validate on updateOne operations
GradeSchema.pre("updateOne", function (next) {
  const update = this.getUpdate() as Record<string, unknown>;
  if (update && typeof update === "object") {
    const marks = update.marks;
    const maxMarks = update.maxMarks;
    if (marks !== undefined && typeof marks === "number") {
      if (
        maxMarks !== undefined &&
        typeof maxMarks === "number" &&
        marks > maxMarks
      ) {
        next(new Error("marks must be less than or equal to maxMarks"));
      } else {
        next();
      }
    } else {
      next();
    }
  } else {
    next();
  }
});

GradeSchema.index({ teacherId: 1, studentId: 1, subject: 1, term: 1 }, { unique: true })

export const Grade = models.Grade ?? model<IGrade>('Grade', GradeSchema)
