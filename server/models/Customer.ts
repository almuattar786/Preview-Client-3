import mongoose, { Schema } from 'mongoose';
import { Customer } from '../../src/types';

export type ICustomerDoc = Customer;

const CustomerSchema = new Schema<ICustomerDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true, index: true },
    city: { type: String, default: '' },
    totalOrders: { type: Number, default: 0, min: 0 },
    totalSpent: { type: Number, default: 0, min: 0 },
    lastOrderDate: { type: String, default: () => new Date().toISOString() },
    createdAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const CustomerModel =
  (mongoose.models.Customer as mongoose.Model<ICustomerDoc>) ||
  mongoose.model<ICustomerDoc>('Customer', CustomerSchema);
