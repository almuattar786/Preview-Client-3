import mongoose, { Schema } from 'mongoose';

export interface IMigrationMarkerDoc {
  migrationKey: string;
  sourceFile: string;
  recordCounts: {
    products: number;
    orders: number;
    customers: number;
    contactMessages: number;
    subscribers: number;
    settings: number;
    adminUser: number;
  };
  migratedAt: string;
  status: 'COMPLETED' | 'FAILED';
  version: string;
}

const MigrationMarkerSchema = new Schema<IMigrationMarkerDoc>(
  {
    migrationKey: { type: String, required: true, unique: true, index: true },
    sourceFile: { type: String, required: true },
    recordCounts: {
      products: { type: Number, default: 0 },
      orders: { type: Number, default: 0 },
      customers: { type: Number, default: 0 },
      contactMessages: { type: Number, default: 0 },
      subscribers: { type: Number, default: 0 },
      settings: { type: Number, default: 0 },
      adminUser: { type: Number, default: 0 }
    },
    migratedAt: { type: String, default: () => new Date().toISOString() },
    status: { type: String, enum: ['COMPLETED', 'FAILED'], default: 'COMPLETED' },
    version: { type: String, default: '1.0.0' }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

export const MigrationMarkerModel =
  (mongoose.models.MigrationMarker as mongoose.Model<IMigrationMarkerDoc>) ||
  mongoose.model<IMigrationMarkerDoc>('MigrationMarker', MigrationMarkerSchema);
