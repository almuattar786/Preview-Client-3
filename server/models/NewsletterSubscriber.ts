import mongoose, { Schema } from 'mongoose';
import { NewsletterSubscriber } from '../../src/types';

export type INewsletterSubscriberDoc = NewsletterSubscriber;

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriberDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    subscribedAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const NewsletterSubscriberModel =
  (mongoose.models.NewsletterSubscriber as mongoose.Model<INewsletterSubscriberDoc>) ||
  mongoose.model<INewsletterSubscriberDoc>('NewsletterSubscriber', NewsletterSubscriberSchema);
