import mongoose, { Schema } from 'mongoose';

export interface IAdminUser {
  id: string;
  email: string;
  passwordHash: string;
  updatedAt: string;
}

const AdminUserSchema = new Schema<IAdminUser>(
  {
    id: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    updatedAt: { type: String, default: () => new Date().toISOString() }
  },
  {
    timestamps: false,
    versionKey: false,
    collection: 'adminusers'
  }
);

export const AdminUserModel =
  (mongoose.models.AdminUser as mongoose.Model<IAdminUser>) ||
  mongoose.model<IAdminUser>('AdminUser', AdminUserSchema, 'adminusers');
