import mongoose, { Schema } from 'mongoose';
import { ContactMessage } from '../../src/types';

export type IContactMessageDoc = ContactMessage;

const ContactMessageSchema = new Schema<IContactMessageDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: '' },
    subject: { type: String, default: 'General Inquiry' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, index: true },
    createdAt: { type: String, default: () => new Date().toISOString(), index: true }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const ContactMessageModel =
  (mongoose.models.ContactMessage as mongoose.Model<IContactMessageDoc>) ||
  mongoose.model<IContactMessageDoc>('ContactMessage', ContactMessageSchema);
