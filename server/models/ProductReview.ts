import mongoose, { Schema } from 'mongoose';
import { ProductReview } from '../../src/types';

export type IProductReviewDoc = ProductReview;

const ProductReviewSchema = new Schema<IProductReviewDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, default: '' },
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '' },
    comment: { type: String, required: true, trim: true },
    isVerifiedBuyer: { type: Boolean, default: false },
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

// Compound index to help enforce 1 review per customer per product
ProductReviewSchema.index({ productId: 1, customerEmail: 1 }, { unique: true });

export const ProductReviewModel =
  (mongoose.models.ProductReview as mongoose.Model<IProductReviewDoc>) ||
  mongoose.model<IProductReviewDoc>('ProductReview', ProductReviewSchema);
