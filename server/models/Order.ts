import mongoose, { Schema } from 'mongoose';
import { Order } from '../../src/types';

export type IOrderDoc = Order;

const SelectedFragranceSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['existing', 'custom'], default: 'existing' },
    name: { type: String, required: true },
    image: { type: String, default: '' },
    size: { type: String, default: '' },
    price: { type: Number },
    category: { type: String, default: '' },
    fragranceType: { type: String, default: '' },
    isCustom: { type: Boolean, default: false }
  },
  { _id: false }
);

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productImage: { type: String, default: '' },
    size: { type: String, default: '' },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
    isBundle: { type: Boolean, default: false },
    requiredSelectionCount: { type: Number },
    selectedProductIds: { type: [String], default: [] },
    selectedProducts: { type: [SelectedFragranceSchema], default: [] }
  },
  { _id: false }
);

const ShippingAddressSchema = new Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String },
    orderNotes: { type: String }
  },
  { _id: false }
);

const StatusHistorySchema = new Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: String, required: true },
    note: { type: String }
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrderDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    orderNumber: { type: String, required: true, unique: true, index: true },
    customer: {
      fullName: { type: String, required: true },
      email: { type: String, required: true, index: true },
      phone: { type: String, required: true }
    },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: { type: String, default: 'Cash on Delivery' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    orderStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Pending',
      index: true
    },
    statusHistory: { type: [StatusHistorySchema], default: [] },
    createdAt: { type: String, default: () => new Date().toISOString(), index: true },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const OrderModel =
  (mongoose.models.Order as mongoose.Model<IOrderDoc>) ||
  mongoose.model<IOrderDoc>('Order', OrderSchema);
