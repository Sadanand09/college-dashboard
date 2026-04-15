import mongoose, { Schema, model, models } from 'mongoose'

export interface IAnnouncement {
  _id: mongoose.Types.ObjectId
  teacherId: string
  title: string
  content: string
  audience: string
  pinned: boolean
  createdAt: Date
  updatedAt: Date
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    teacherId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    audience: { type: String, default: 'All' },
    pinned: { type: Boolean, default: false },
  },
  { timestamps: true }
)

export const Announcement =
  models.Announcement ?? model<IAnnouncement>('Announcement', AnnouncementSchema)
