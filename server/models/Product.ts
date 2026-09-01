import mongoose, { Schema } from 'mongoose';
import { Product } from '../../src/types';

export type IProductDoc = Product;

const FragranceNotesSchema = new Schema(
  {
    top: { type: [String], default: [] },
    heart: { type: [String], default: [] },
    base: { type: [String], default: [] }
  },
  { _id: false }
);

const ProductSizeOptionSchema = new Schema(
  {
    size: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, default: '' },
    isDefault: { type: Boolean, default: false }
  },
  { _id: false }
);

const BundleOptionSchema = new Schema(
  {
    id: { type: String, required: true },
    type: { type: String, enum: ['existing', 'custom'], required: true },
    productId: { type: String },
    name: { type: String, default: '' },
    image: { type: String, default: '' },
    category: { type: String, default: '' },
    size: { type: String, default: '' },
    price: { type: Number }
  },
  { _id: false }
);

const ProductSchema = new Schema<IProductDoc>(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: '' },
    shortDescription: { type: String, default: '' },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number },
    category: { type: String, required: true, index: true },
    categories: { type: [String], default: [] },
    brand: { type: String, default: "Al-Mu'attar" },
    size: { type: String, default: '50ml' },
    sizeOptions: { type: [ProductSizeOptionSchema], default: [] },
    fragranceType: { type: String, required: true },
    gender: { type: String, required: true, enum: ['Men', 'Women', 'Unisex'], index: true },
    notes: { type: FragranceNotesSchema, default: () => ({ top: [], heart: [], base: [] }) },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sku: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    isBestseller: { type: Boolean, default: false },
    is_bestseller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true, index: true },
    isFreeShipping: { type: Boolean, default: false },
    customShippingFee: { type: Number },
    collectionPlacement: { type: String, enum: ['shop', 'our', 'both'], default: 'shop', index: true },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    isBundle: { type: Boolean, default: false, index: true },
    requiredSelectionCount: { type: Number, default: 1 },
    eligibleProductIds: { type: [String], default: [] },
    bundleOptions: { type: [BundleOptionSchema], default: [] },
    bundleBadge: { type: String, default: '' },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

ProductSchema.index({
  name: 'text',
  description: 'text',
  category: 'text',
  sku: 'text'
});

export const ProductModel =
  (mongoose.models.Product as mongoose.Model<IProductDoc>) ||
  mongoose.model<IProductDoc>('Product', ProductSchema);
