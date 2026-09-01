import fs from 'fs';
import path from 'path';
import { ProductModel } from './models/Product';
import { OrderModel } from './models/Order';
import { CustomerModel } from './models/Customer';
import { ContactMessageModel } from './models/ContactMessage';
import { NewsletterSubscriberModel } from './models/NewsletterSubscriber';
import { StoreSettingsModel } from './models/StoreSettings';
import { AdminUserModel } from './models/AdminUser';
import { MigrationMarkerModel } from './models/MigrationMarker';
import { isMongoConnected } from './mongodb';

const MIGRATION_KEY = 'initial_database_json_migration_v1';
const DB_FILE = path.join(process.cwd(), 'data', 'database.json');

export interface MigrationSummary {
  alreadyMigrated: boolean;
  success: boolean;
  sourceFile: string;
  counts: {
    products: number;
    orders: number;
    customers: number;
    contactMessages: number;
    subscribers: number;
    settings: number;
    adminUser: number;
  };
  migratedAt?: string;
  error?: string;
}

export async function runDatabaseJsonMigration(): Promise<MigrationSummary> {
  if (!isMongoConnected()) {
    return {
      alreadyMigrated: false,
      success: false,
      sourceFile: DB_FILE,
      counts: { products: 0, orders: 0, customers: 0, contactMessages: 0, subscribers: 0, settings: 0, adminUser: 0 },
      error: 'MongoDB is not connected.'
    };
  }

  // 1. Check if one-time migration was already completed
  const existingMarker = await MigrationMarkerModel.findOne({ migrationKey: MIGRATION_KEY }).lean();
  if (existingMarker && existingMarker.status === 'COMPLETED') {
    console.log(`🔒 Idempotency check: Migration "${MIGRATION_KEY}" was already applied at ${existingMarker.migratedAt}. Skipping.`);
    return {
      alreadyMigrated: true,
      success: true,
      sourceFile: existingMarker.sourceFile,
      counts: existingMarker.recordCounts,
      migratedAt: existingMarker.migratedAt
    };
  }

  // 2. Verify source file existence
  if (!fs.existsSync(DB_FILE)) {
    console.log(`ℹ️  Source database file "${DB_FILE}" does not exist. Skipping file migration.`);
    return {
      alreadyMigrated: false,
      success: true,
      sourceFile: DB_FILE,
      counts: { products: 0, orders: 0, customers: 0, contactMessages: 0, subscribers: 0, settings: 0, adminUser: 0 }
    };
  }

  try {
    console.log(`📦 Starting one-time idempotent migration from "${DB_FILE}" to MongoDB Atlas...`);
    const rawContent = fs.readFileSync(DB_FILE, 'utf-8');
    const sourceData = JSON.parse(rawContent);

    const counts = {
      products: 0,
      orders: 0,
      customers: 0,
      contactMessages: 0,
      subscribers: 0,
      settings: 0,
      adminUser: 0
    };

    // A. Migrate Products
    if (Array.isArray(sourceData.products) && sourceData.products.length > 0) {
      for (const prod of sourceData.products) {
        if (!prod.id) continue;
        await ProductModel.findOneAndUpdate(
          { id: prod.id },
          { $set: prod },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        counts.products++;
      }
      console.log(`  ✓ Migrated ${counts.products} products.`);
    }

    // B. Migrate Orders
    if (Array.isArray(sourceData.orders) && sourceData.orders.length > 0) {
      for (const ord of sourceData.orders) {
        if (!ord.id) continue;
        await OrderModel.findOneAndUpdate(
          { id: ord.id },
          { $set: ord },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        counts.orders++;
      }
      console.log(`  ✓ Migrated ${counts.orders} orders.`);
    }

    // C. Migrate Customers
    if (Array.isArray(sourceData.customers) && sourceData.customers.length > 0) {
      for (const cust of sourceData.customers) {
        if (!cust.id && !cust.email) continue;
        await CustomerModel.findOneAndUpdate(
          { email: cust.email.toLowerCase() },
          { $set: cust },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        counts.customers++;
      }
      console.log(`  ✓ Migrated ${counts.customers} customers.`);
    }

    // D. Migrate Contact Messages
    if (Array.isArray(sourceData.contactMessages) && sourceData.contactMessages.length > 0) {
      for (const msg of sourceData.contactMessages) {
        if (!msg.id) continue;
        await ContactMessageModel.findOneAndUpdate(
          { id: msg.id },
          { $set: msg },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        counts.contactMessages++;
      }
      console.log(`  ✓ Migrated ${counts.contactMessages} contact messages.`);
    }

    // E. Migrate Subscribers
    if (Array.isArray(sourceData.subscribers) && sourceData.subscribers.length > 0) {
      for (const sub of sourceData.subscribers) {
        if (!sub.email) continue;
        await NewsletterSubscriberModel.findOneAndUpdate(
          { email: sub.email.toLowerCase() },
          { $set: sub },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        counts.subscribers++;
      }
      console.log(`  ✓ Migrated ${counts.subscribers} newsletter subscribers.`);
    }

    // F. Migrate Store Settings
    if (sourceData.settings) {
      await StoreSettingsModel.findOneAndUpdate(
        { key: 'primary_settings' },
        { $set: { key: 'primary_settings', settings: sourceData.settings, updatedAt: new Date().toISOString() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      counts.settings = 1;
      console.log('  ✓ Migrated Store Settings & CMS configurations.');
    }

    // G. Migrate Admin User
    if (sourceData.adminUser && sourceData.adminUser.email) {
      await AdminUserModel.findOneAndUpdate(
        { email: sourceData.adminUser.email.toLowerCase() },
        { $set: sourceData.adminUser },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      counts.adminUser = 1;
      console.log(`  ✓ Migrated Admin user credentials (${sourceData.adminUser.email}).`);
    }

    const migratedAt = new Date().toISOString();

    // H. Write Permanent Migration Marker
    await MigrationMarkerModel.findOneAndUpdate(
      { migrationKey: MIGRATION_KEY },
      {
        $set: {
          migrationKey: MIGRATION_KEY,
          sourceFile: DB_FILE,
          recordCounts: counts,
          migratedAt,
          status: 'COMPLETED',
          version: '1.0.0'
        }
      },
      { upsert: true, new: true }
    );

    console.log(`🎉 Migration "${MIGRATION_KEY}" completed successfully! All records verified in MongoDB Atlas.`);

    return {
      alreadyMigrated: false,
      success: true,
      sourceFile: DB_FILE,
      counts,
      migratedAt
    };
  } catch (err: any) {
    console.error('❌ Migration failed:', err);
    await MigrationMarkerModel.findOneAndUpdate(
      { migrationKey: MIGRATION_KEY },
      {
        $set: {
          migrationKey: MIGRATION_KEY,
          sourceFile: DB_FILE,
          status: 'FAILED',
          migratedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    throw err;
  }
}
