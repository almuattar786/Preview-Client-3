/**
 * MongoDB to MySQL Migration Script for Al-Mu'attar E-Commerce
 *
 * This script safely and non-destructively reads records from MongoDB Atlas (or local backup)
 * and inserts/upserts them into Hostinger Managed MySQL using Prisma ORM.
 *
 * Usage:
 *   npx tsx scripts/migrate-mongodb-to-mysql.ts
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { PrismaClient } from '@prisma/client';
import { ProductModel } from '../server/models/Product';
import { OrderModel } from '../server/models/Order';
import { CustomerModel } from '../server/models/Customer';
import { ContactMessageModel } from '../server/models/ContactMessage';
import { NewsletterSubscriberModel } from '../server/models/NewsletterSubscriber';
import { StoreSettingsModel } from '../server/models/StoreSettings';
import { AdminUserModel } from '../server/models/AdminUser';

const prisma = new PrismaClient();

interface MigrationReport {
  timestamp: string;
  source: 'mongodb' | 'file_backup';
  counts: {
    adminUsers: number;
    settings: number;
    products: number;
    customers: number;
    orders: number;
    orderItems: number;
    contactMessages: number;
    newsletterSubscribers: number;
  };
  errors: string[];
}

async function runMigration() {
  console.log('====================================================');
  console.log('🚀 Al-Mu\'attar: Starting MongoDB to MySQL Migration');
  console.log('====================================================');

  const report: MigrationReport = {
    timestamp: new Date().toISOString(),
    source: 'mongodb',
    counts: {
      adminUsers: 0,
      settings: 0,
      products: 0,
      customers: 0,
      orders: 0,
      orderItems: 0,
      contactMessages: 0,
      newsletterSubscribers: 0
    },
    errors: []
  };

  // 1. Verify MySQL connection
  try {
    console.log('🔌 Verifying MySQL connection via Prisma...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connected to MySQL successfully.');
  } catch (err: any) {
    console.error('❌ Failed to connect to MySQL:', err.message);
    console.error('Please verify that DATABASE_URL is set in your .env file.');
    process.exit(1);
  }

  // 2. Connect to MongoDB if MONGODB_URI is provided
  let isMongoConnected = false;
  const mongoUri = process.env.MONGODB_URI;

  if (mongoUri) {
    try {
      console.log('🔌 Connecting to MongoDB Atlas source database...');
      const dbName = process.env.MONGODB_DB_NAME || 'al_muattar_db';
      await mongoose.connect(mongoUri, { dbName, serverSelectionTimeoutMS: 5000 });
      isMongoConnected = true;
      console.log(`✅ Connected to MongoDB Atlas ("${dbName}").`);
    } catch (mErr: any) {
      console.warn('⚠️ Could not connect to MongoDB Atlas directly:', mErr.message);
    }
  }

  // Fallback to local backup json if MongoDB direct query is unavailable
  let fileData: any = null;
  const backupFiles = [
    path.join(process.cwd(), 'data', 'database.backup.json'),
    path.join(process.cwd(), 'data', 'database.json')
  ];

  for (const bFile of backupFiles) {
    if (fs.existsSync(bFile)) {
      try {
        fileData = JSON.parse(fs.readFileSync(bFile, 'utf-8'));
        console.log(`📁 Loaded fallback data reference from: ${bFile}`);
        break;
      } catch (e) {
        // ignore
      }
    }
  }

  // 3. Migrate Admin Users
  console.log('\n--- 1. Migrating Admin Users ---');
  try {
    let adminUsers: any[] = [];
    if (isMongoConnected) {
      adminUsers = await AdminUserModel.find().lean();
    } else if (fileData?.adminUser) {
      adminUsers = [fileData.adminUser];
    }

    for (const admin of adminUsers) {
      await prisma.adminUser.upsert({
        where: { id: admin.id || 'admin-001' },
        update: {
          email: admin.email.toLowerCase().trim(),
          passwordHash: admin.passwordHash,
          updatedAt: admin.updatedAt || new Date().toISOString()
        },
        create: {
          id: admin.id || 'admin-001',
          email: admin.email.toLowerCase().trim(),
          passwordHash: admin.passwordHash,
          updatedAt: admin.updatedAt || new Date().toISOString()
        }
      });
      report.counts.adminUsers++;
    }
    console.log(`✓ Migrated ${report.counts.adminUsers} admin user(s).`);
  } catch (err: any) {
    console.error('Error migrating admin users:', err.message);
    report.errors.push(`Admin users: ${err.message}`);
  }

  // 4. Migrate Store Settings
  console.log('\n--- 2. Migrating Store Settings & CMS ---');
  try {
    let settingsDoc: any = null;
    if (isMongoConnected) {
      settingsDoc = await StoreSettingsModel.findOne({ key: 'primary_settings' }).lean();
    }
    const settingsData = settingsDoc?.settings || fileData?.settings;

    if (settingsData) {
      await prisma.storeSettings.upsert({
        where: { key: 'primary_settings' },
        update: {
          settings: settingsData as any,
          updatedAt: new Date().toISOString()
        },
        create: {
          id: 'primary_settings',
          key: 'primary_settings',
          settings: settingsData as any,
          updatedAt: new Date().toISOString()
        }
      });
      report.counts.settings = 1;
      console.log('✓ Migrated Store Settings & CMS configuration.');
    }
  } catch (err: any) {
    console.error('Error migrating store settings:', err.message);
    report.errors.push(`Settings: ${err.message}`);
  }

  // 5. Migrate Products
  console.log('\n--- 3. Migrating Products Catalog ---');
  try {
    let products: any[] = [];
    if (isMongoConnected) {
      products = await ProductModel.find().lean();
    } else if (Array.isArray(fileData?.products)) {
      products = fileData.products;
    }

    for (const prod of products) {
      if (!prod.id) continue;
      const notesJson = prod.notes || { top: [], heart: [], base: [] };
      const imagesJson = Array.isArray(prod.images) ? prod.images : [];
      const categoriesJson = Array.isArray(prod.categories) ? prod.categories : [prod.category];

      await prisma.product.upsert({
        where: { id: prod.id },
        update: {
          name: prod.name,
          slug: prod.slug,
          description: prod.description || '',
          shortDescription: prod.shortDescription || '',
          price: Number(prod.price),
          compareAtPrice: prod.compareAtPrice ? Number(prod.compareAtPrice) : null,
          category: prod.category,
          categories: categoriesJson as any,
          brand: prod.brand || "Al-Mu'attar",
          size: prod.size || '50ml',
          fragranceType: prod.fragranceType,
          gender: prod.gender,
          notes: notesJson as any,
          images: imagesJson as any,
          stock: Number(prod.stock || 0),
          sku: prod.sku || '',
          isFeatured: Boolean(prod.isFeatured),
          isBestseller: Boolean(prod.isBestseller),
          is_bestseller: Boolean(prod.is_bestseller),
          isActive: prod.isActive !== false,
          isFreeShipping: Boolean(prod.isFreeShipping),
          customShippingFee: prod.customShippingFee ? Number(prod.customShippingFee) : null,
          createdAt: prod.createdAt || new Date().toISOString(),
          updatedAt: prod.updatedAt || new Date().toISOString()
        },
        create: {
          id: prod.id,
          name: prod.name,
          slug: prod.slug,
          description: prod.description || '',
          shortDescription: prod.shortDescription || '',
          price: Number(prod.price),
          compareAtPrice: prod.compareAtPrice ? Number(prod.compareAtPrice) : null,
          category: prod.category,
          categories: categoriesJson as any,
          brand: prod.brand || "Al-Mu'attar",
          size: prod.size || '50ml',
          fragranceType: prod.fragranceType,
          gender: prod.gender,
          notes: notesJson as any,
          images: imagesJson as any,
          stock: Number(prod.stock || 0),
          sku: prod.sku || '',
          isFeatured: Boolean(prod.isFeatured),
          isBestseller: Boolean(prod.isBestseller),
          is_bestseller: Boolean(prod.is_bestseller),
          isActive: prod.isActive !== false,
          isFreeShipping: Boolean(prod.isFreeShipping),
          customShippingFee: prod.customShippingFee ? Number(prod.customShippingFee) : null,
          createdAt: prod.createdAt || new Date().toISOString(),
          updatedAt: prod.updatedAt || new Date().toISOString()
        }
      });
      report.counts.products++;
    }
    console.log(`✓ Migrated ${report.counts.products} products.`);
  } catch (err: any) {
    console.error('Error migrating products:', err.message);
    report.errors.push(`Products: ${err.message}`);
  }

  // 6. Migrate Customers
  console.log('\n--- 4. Migrating Customers ---');
  try {
    let customers: any[] = [];
    if (isMongoConnected) {
      customers = await CustomerModel.find().lean();
    } else if (Array.isArray(fileData?.customers)) {
      customers = fileData.customers;
    }

    for (const cust of customers) {
      if (!cust.id || !cust.email) continue;
      await prisma.customer.upsert({
        where: { id: cust.id },
        update: {
          fullName: cust.fullName,
          email: cust.email.toLowerCase().trim(),
          phone: cust.phone || '',
          city: cust.city || '',
          totalOrders: Number(cust.totalOrders || 0),
          totalSpent: Number(cust.totalSpent || 0),
          lastOrderDate: cust.lastOrderDate || new Date().toISOString(),
          createdAt: cust.createdAt || new Date().toISOString()
        },
        create: {
          id: cust.id,
          fullName: cust.fullName,
          email: cust.email.toLowerCase().trim(),
          phone: cust.phone || '',
          city: cust.city || '',
          totalOrders: Number(cust.totalOrders || 0),
          totalSpent: Number(cust.totalSpent || 0),
          lastOrderDate: cust.lastOrderDate || new Date().toISOString(),
          createdAt: cust.createdAt || new Date().toISOString()
        }
      });
      report.counts.customers++;
    }
    console.log(`✓ Migrated ${report.counts.customers} customer records.`);
  } catch (err: any) {
    console.error('Error migrating customers:', err.message);
    report.errors.push(`Customers: ${err.message}`);
  }

  // 7. Migrate Orders and Order Items
  console.log('\n--- 5. Migrating Orders and Order Items ---');
  try {
    let orders: any[] = [];
    if (isMongoConnected) {
      orders = await OrderModel.find().lean();
    } else if (Array.isArray(fileData?.orders)) {
      orders = fileData.orders;
    }

    for (const ord of orders) {
      if (!ord.id || !ord.orderNumber) continue;

      // Find or link customer if available
      let customerId: string | null = null;
      if (ord.customer?.email) {
        const foundCust = await prisma.customer.findUnique({
          where: { email: ord.customer.email.toLowerCase().trim() }
        });
        if (foundCust) {
          customerId = foundCust.id;
        }
      }

      await prisma.order.upsert({
        where: { id: ord.id },
        update: {
          orderNumber: ord.orderNumber,
          customerId,
          customerFullName: ord.customer?.fullName || '',
          customerEmail: (ord.customer?.email || '').toLowerCase().trim(),
          customerPhone: ord.customer?.phone || '',
          shippingFullName: ord.shippingAddress?.fullName || ord.customer?.fullName || '',
          shippingPhone: ord.shippingAddress?.phone || ord.customer?.phone || '',
          shippingEmail: (ord.shippingAddress?.email || ord.customer?.email || '').toLowerCase().trim(),
          shippingAddress: ord.shippingAddress?.address || '',
          shippingCity: ord.shippingAddress?.city || '',
          shippingPostalCode: ord.shippingAddress?.postalCode || null,
          shippingOrderNotes: ord.shippingAddress?.orderNotes || null,
          subtotal: Number(ord.subtotal || 0),
          shippingFee: Number(ord.shippingFee || 0),
          totalAmount: Number(ord.totalAmount || 0),
          paymentMethod: ord.paymentMethod || 'Cash on Delivery',
          paymentStatus: ord.paymentStatus || 'Pending',
          orderStatus: ord.orderStatus || 'Pending',
          statusHistory: (ord.statusHistory || []) as any,
          rawItemsJson: ord.items as any,
          createdAt: ord.createdAt || new Date().toISOString(),
          updatedAt: ord.updatedAt || new Date().toISOString()
        },
        create: {
          id: ord.id,
          orderNumber: ord.orderNumber,
          customerId,
          customerFullName: ord.customer?.fullName || '',
          customerEmail: (ord.customer?.email || '').toLowerCase().trim(),
          customerPhone: ord.customer?.phone || '',
          shippingFullName: ord.shippingAddress?.fullName || ord.customer?.fullName || '',
          shippingPhone: ord.shippingAddress?.phone || ord.customer?.phone || '',
          shippingEmail: (ord.shippingAddress?.email || ord.customer?.email || '').toLowerCase().trim(),
          shippingAddress: ord.shippingAddress?.address || '',
          shippingCity: ord.shippingAddress?.city || '',
          shippingPostalCode: ord.shippingAddress?.postalCode || null,
          shippingOrderNotes: ord.shippingAddress?.orderNotes || null,
          subtotal: Number(ord.subtotal || 0),
          shippingFee: Number(ord.shippingFee || 0),
          totalAmount: Number(ord.totalAmount || 0),
          paymentMethod: ord.paymentMethod || 'Cash on Delivery',
          paymentStatus: ord.paymentStatus || 'Pending',
          orderStatus: ord.orderStatus || 'Pending',
          statusHistory: (ord.statusHistory || []) as any,
          rawItemsJson: ord.items as any,
          createdAt: ord.createdAt || new Date().toISOString(),
          updatedAt: ord.updatedAt || new Date().toISOString()
        }
      });

      // Re-create items cleanly
      await prisma.orderItem.deleteMany({ where: { orderId: ord.id } });

      if (Array.isArray(ord.items)) {
        for (const item of ord.items) {
          await prisma.orderItem.create({
            data: {
              id: `${ord.id}-item-${Math.random().toString(36).substring(2, 9)}`,
              orderId: ord.id,
              productId: (item.productId as string) || null,
              productName: item.productName || 'Fragrance Product',
              productImage: item.productImage || '',
              size: item.size || '50ml',
              quantity: Number(item.quantity || 1),
              price: Number(item.price || 0),
              subtotal: Number(item.subtotal || item.price * item.quantity)
            } as any
          });
          report.counts.orderItems++;
        }
      }
      report.counts.orders++;
    }
    console.log(`✓ Migrated ${report.counts.orders} orders with ${report.counts.orderItems} line items.`);
  } catch (err: any) {
    console.error('Error migrating orders:', err.message);
    report.errors.push(`Orders: ${err.message}`);
  }

  // 8. Migrate Contact Messages
  console.log('\n--- 6. Migrating Contact Messages ---');
  try {
    let messages: any[] = [];
    if (isMongoConnected) {
      messages = await ContactMessageModel.find().lean();
    } else if (Array.isArray(fileData?.contactMessages)) {
      messages = fileData.contactMessages;
    }

    for (const msg of messages) {
      if (!msg.id) continue;
      await prisma.contactMessage.upsert({
        where: { id: msg.id },
        update: {
          fullName: msg.fullName,
          email: msg.email.toLowerCase().trim(),
          phone: msg.phone || '',
          subject: msg.subject || 'General Inquiry',
          message: msg.message,
          isRead: Boolean(msg.isRead),
          createdAt: msg.createdAt || new Date().toISOString()
        },
        create: {
          id: msg.id,
          fullName: msg.fullName,
          email: msg.email.toLowerCase().trim(),
          phone: msg.phone || '',
          subject: msg.subject || 'General Inquiry',
          message: msg.message,
          isRead: Boolean(msg.isRead),
          createdAt: msg.createdAt || new Date().toISOString()
        }
      });
      report.counts.contactMessages++;
    }
    console.log(`✓ Migrated ${report.counts.contactMessages} contact message(s).`);
  } catch (err: any) {
    console.error('Error migrating contact messages:', err.message);
    report.errors.push(`Contact messages: ${err.message}`);
  }

  // 9. Migrate Newsletter Subscribers
  console.log('\n--- 7. Migrating Newsletter Subscribers ---');
  try {
    let subscribers: any[] = [];
    if (isMongoConnected) {
      subscribers = await NewsletterSubscriberModel.find().lean();
    } else if (Array.isArray(fileData?.subscribers)) {
      subscribers = fileData.subscribers;
    }

    for (const sub of subscribers) {
      if (!sub.email) continue;
      const cleanEmail = sub.email.toLowerCase().trim();
      await prisma.newsletterSubscriber.upsert({
        where: { email: cleanEmail },
        update: {
          subscribedAt: sub.subscribedAt || new Date().toISOString()
        },
        create: {
          id: sub.id || `sub-${Date.now()}`,
          email: cleanEmail,
          subscribedAt: sub.subscribedAt || new Date().toISOString()
        }
      });
      report.counts.newsletterSubscribers++;
    }
    console.log(`✓ Migrated ${report.counts.newsletterSubscribers} newsletter subscriber(s).`);
  } catch (err: any) {
    console.error('Error migrating subscribers:', err.message);
    report.errors.push(`Subscribers: ${err.message}`);
  }

  // 10. Write Migration Marker in MySQL
  try {
    await prisma.migrationMarker.upsert({
      where: { migrationKey: 'mongodb_to_mysql_migration_v1' },
      update: {
        migratedAt: new Date().toISOString(),
        recordCounts: report.counts as any,
        sourceFile: isMongoConnected ? 'MongoDB Atlas (Live)' : 'JSON Backup',
        status: report.errors.length === 0 ? 'COMPLETED' : 'COMPLETED_WITH_WARNINGS',
        version: '1.0.0'
      },
      create: {
        id: 'mongodb_to_mysql_migration_v1',
        migrationKey: 'mongodb_to_mysql_migration_v1',
        migratedAt: new Date().toISOString(),
        recordCounts: report.counts as any,
        sourceFile: isMongoConnected ? 'MongoDB Atlas (Live)' : 'JSON Backup',
        status: report.errors.length === 0 ? 'COMPLETED' : 'COMPLETED_WITH_WARNINGS',
        version: '1.0.0'
      }
    });
  } catch (mErr: any) {
    console.warn('Warning writing migration marker:', mErr.message);
  }

  console.log('\n====================================================');
  console.log('🎉 Migration Completed Successfully!');
  console.log('====================================================');
  console.log('Summary of Records in MySQL:');
  console.table(report.counts);

  if (report.errors.length > 0) {
    console.warn('⚠️ Warnings/Errors encountered during migration:');
    console.warn(report.errors);
  }

  if (isMongoConnected) {
    await mongoose.disconnect();
  }
  await prisma.$disconnect();
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
