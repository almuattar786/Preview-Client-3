import dotenv from 'dotenv';
dotenv.config({ path: ['.env.local', '.env', '.env.example'] });

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { db, DatabaseUnavailableError } from './server/db';
import { OrderStatus } from './src/types';
import { isMongoConnected, getMongoStatus, connectMongo, hasMongoConfigured } from './server/mongodb';
import { runDatabaseJsonMigration } from './server/migration';
import { uploadToGridFS, getGridFSFile, deleteFromGridFS } from './server/gridfs';
import {
  handleImageRequest,
  prewarmImage,
  prewarmAllCriticalImages,
  invalidateImageCache
} from './server/imageOptimizer';

const PORT = parseInt(process.env.PORT || '3000', 10);

// Ensure uploads folder exists in working directory
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Strict 5 MB maximum file size limit (5 * 1024 * 1024 bytes = 5,242,880 bytes)
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif'];

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(mime) && !ALLOWED_EXTENSIONS.includes(ext)) {
      return cb(new Error('Please select a valid JPG, PNG, WEBP, GIF, or AVIF image.'));
    }
    cb(null, true);
  }
});

function escapeHtmlAttr(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function injectStoreBootstrap(html: string, settings: any): string {
  const storeName = (settings?.storeName && String(settings.storeName).trim()) 
    ? String(settings.storeName).trim() 
    : "Al-Mu'attar";
  const heroUrl = settings?.heroImageUrl || '/api/images/fragrance-1787583098886-c15e2217bb5653a6.jpg';
  const logoUrl = settings?.logoUrl || '/api/images/fragrance-1787584475157-430ddcaba4074ac0.png';

  const defaultTitle = `${storeName} | Luxury Oriental Perfumes & Pure Attars`;
  const defaultDescription = `${storeName} crafts mastercrafted oriental fragrances, rare Cambodian Oud, pure non-alcoholic attars, and luxury high-sillage French Extrait de Parfums in Pakistan.`;
  const defaultOgDescription = `Discover royal Cambodian Oud, Taif roses, and artisanal perfume oils with nationwide Cash on Delivery in Pakistan by ${storeName}.`;
  const defaultKeywords = `${storeName}, Oud perfume Pakistan, luxury attar oil, Cambodian Oud, Taif Rose, Extrait de Parfum, fragrance categories, oriental perfumes`;

  let updatedHtml = html;

  // 1. Replace or inject <title>
  if (/<title>[\s\S]*?<\/title>/i.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtmlText(defaultTitle)}</title>`);
  } else {
    updatedHtml = updatedHtml.replace('<head>', `<head>\n    <title>${escapeHtmlText(defaultTitle)}</title>`);
  }

  // 2. Replace or inject <meta property="og:title" ... />
  if (/<meta\s+[^>]*property=["']og:title["'][^>]*>/i.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(
      /<meta\s+[^>]*property=["']og:title["'][^>]*>/i,
      `<meta property="og:title" content="${escapeHtmlAttr(defaultTitle)}" />`
    );
  } else {
    updatedHtml = updatedHtml.replace('</head>', `    <meta property="og:title" content="${escapeHtmlAttr(defaultTitle)}" />\n  </head>`);
  }

  // 3. Replace or inject <meta property="og:site_name" ... />
  if (/<meta\s+[^>]*property=["']og:site_name["'][^>]*>/i.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(
      /<meta\s+[^>]*property=["']og:site_name["'][^>]*>/i,
      `<meta property="og:site_name" content="${escapeHtmlAttr(storeName)}" />`
    );
  } else {
    updatedHtml = updatedHtml.replace('</head>', `    <meta property="og:site_name" content="${escapeHtmlAttr(storeName)}" />\n  </head>`);
  }

  // 4. Replace or inject <meta name="description" ... />
  if (/<meta\s+[^>]*name=["']description["'][^>]*>/i.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(
      /<meta\s+[^>]*name=["']description["'][^>]*>/i,
      `<meta name="description" content="${escapeHtmlAttr(defaultDescription)}" />`
    );
  }

  // 5. Replace or inject <meta property="og:description" ... />
  if (/<meta\s+[^>]*property=["']og:description["'][^>]*>/i.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(
      /<meta\s+[^>]*property=["']og:description["'][^>]*>/i,
      `<meta property="og:description" content="${escapeHtmlAttr(defaultOgDescription)}" />`
    );
  }

  // 6. Replace or inject <meta name="keywords" ... />
  if (/<meta\s+[^>]*name=["']keywords["'][^>]*>/i.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(
      /<meta\s+[^>]*name=["']keywords["'][^>]*>/i,
      `<meta name="keywords" content="${escapeHtmlAttr(defaultKeywords)}" />`
    );
  }

  // 7. Replace or inject <meta name="twitter:title" ... />
  if (/<meta\s+[^>]*name=["']twitter:title["'][^>]*>/i.test(updatedHtml)) {
    updatedHtml = updatedHtml.replace(
      /<meta\s+[^>]*name=["']twitter:title["'][^>]*>/i,
      `<meta name="twitter:title" content="${escapeHtmlAttr(defaultTitle)}" />`
    );
  } else {
    updatedHtml = updatedHtml.replace('</head>', `    <meta name="twitter:title" content="${escapeHtmlAttr(defaultTitle)}" />\n  </head>`);
  }

  let preloads = '';
  if (heroUrl) {
    preloads += `\n    <link rel="preload" as="image" href="${heroUrl}" fetchpriority="high" />`;
  }
  const isLogoEnabled = settings?.isLogoEnabled !== false;
  if (logoUrl && isLogoEnabled) {
    preloads += `\n    <link rel="preload" as="image" href="${logoUrl}" fetchpriority="high" />`;
  }

  const publicSettings = {
    storeName: storeName,
    tagline: settings?.tagline,
    currencySymbol: settings?.currencySymbol,
    shippingFee: settings?.shippingFee,
    standardShippingFee: settings?.standardShippingFee,
    freeShippingThreshold: settings?.freeShippingThreshold,
    isFreeShippingEnabled: settings?.isFreeShippingEnabled,
    contactEmail: settings?.contactEmail,
    supportEmail: settings?.supportEmail,
    contactPhone: settings?.contactPhone,
    whatsappNumber: settings?.whatsappNumber,
    storeAddress: settings?.storeAddress,
    isLogoEnabled: isLogoEnabled,
    logoUrl: settings?.logoUrl || logoUrl,
    heroImageUrl: settings?.heroImageUrl || heroUrl,
    heroBadgeText: settings?.heroBadgeText,
    heroHeadingLine1: settings?.heroHeadingLine1,
    heroHeadingGradient: settings?.heroHeadingGradient,
    heroDescription: settings?.heroDescription,
    promiseStatement: settings?.promiseStatement,
    footerText: settings?.footerText,
    announcementBarText: settings?.announcementBarText,
    homepageCategoriesCount: settings?.homepageCategoriesCount,
    categories: settings?.categories,
    collections: settings?.collections,
    ourCollection: settings?.ourCollection,
    shopCollection: settings?.shopCollection
  };

  const scriptTag = `<script id="initial-store-settings">window.__INITIAL_STORE_SETTINGS__ = ${JSON.stringify(publicSettings).replace(/</g, '\\u003c')};</script>`;

  return updatedHtml.replace('</head>', `${preloads}\n    ${scriptTag}\n  </head>`);
}

// Generate or fetch strong JWT Secret (server-side only)
const JWT_SECRET = process.env.JWT_SECRET || (
  process.env.NODE_ENV === 'production' 
    ? crypto.randomBytes(32).toString('hex') 
    : 'al_muattar_dev_jwt_secret_key_change_in_production'
);

interface AuthenticatedRequest extends Request {
  adminUser?: {
    id: string;
    email: string;
  };
}

async function startServer() {
  // 1. Initialize DB (connects to MongoDB Atlas and triggers idempotent migration if needed)
  try {
    await db.initialize();
    const [initialSettings, initialProducts] = await Promise.all([
      db.getSettings().catch(() => null),
      db.getProducts({ includeInactive: false }).catch(() => [])
    ]);
    if (initialSettings) {
      prewarmAllCriticalImages(initialSettings, initialProducts || []);
    }
  } catch (dbErr) {
    console.error('Database initialization warning:', dbErr);
  }

  const app = express();

  // Middleware
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Image serving routes with automatic sharp WebP optimization, in-memory LRU caching, and HTTP caching
  app.get('/api/images/:filename', handleImageRequest);
  app.get('/uploads/:filename', handleImageRequest);

  // --- AUTH MIDDLEWARE ---
  const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      let token = req.cookies?.admin_token;

      if (!token && req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized: Admin authentication required.' });
      }

      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string };
      req.adminUser = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, message: 'Invalid or expired authentication session.' });
    }
  };

  const sendError = (res: Response, err: any, defaultMsg = 'Internal server error') => {
    const isDbUnavailable = err instanceof DatabaseUnavailableError || err?.statusCode === 503;
    const status = isDbUnavailable ? 503 : (err?.statusCode || 500);
    return res.status(status).json({
      success: false,
      status,
      message: err?.message || defaultMsg,
      isDatabaseUnavailable: isDbUnavailable
    });
  };

  // --- API ROUTES ---

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    const isReady = isMongoConnected();
    const isConfigured = hasMongoConfigured();
    res.json({
      status: isReady || !isConfigured ? 'ok' : 'degraded',
      store: "Al-Mu'attar E-Commerce API",
      database: isReady 
        ? 'MongoDB Atlas (Connected - Single Source of Truth)' 
        : isConfigured 
        ? 'MongoDB Atlas (Disconnected / Reconnecting - Single Source of Truth)' 
        : 'Local File Persistence (Dev Mode)',
      isDatabaseAvailable: isReady || !isConfigured,
      timestamp: new Date().toISOString()
    });
  });

  // 1. ADMIN AUTH & SESSION ENDPOINTS
  app.post('/api/auth/session', async (req: Request, res: Response) => {
    try {
      // Establish or renew server-authorized admin session with default admin identity
      const adminIdentity = {
        id: 'admin-001',
        email: 'admin@store.com',
        role: 'superadmin'
      };

      const token = jwt.sign(adminIdentity, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: 'Admin session authorized.',
        token,
        admin: adminIdentity
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Server error authorizing admin session.' });
    }
  });

  // Admin login endpoint supporting both automated default authentication and credential verification
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body || {};

      if (email && password) {
        const normalizedEmail = String(email).toLowerCase().trim();
        const dbAdmin = await db.getAdminUser();
        let isValid = false;

        const defaultEmail = (process.env.ADMIN_EMAIL || 'admin@store.com').toLowerCase().trim();
        const allowedEmails = [defaultEmail, 'admin@store.com', dbAdmin?.email?.toLowerCase().trim()].filter(Boolean);

        if (allowedEmails.includes(normalizedEmail)) {
          if (dbAdmin && dbAdmin.passwordHash) {
            isValid = bcrypt.compareSync(password, dbAdmin.passwordHash);
          } else {
            const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin@1234';
            isValid = (password === defaultAdminPassword);
          }
        }

        if (!isValid) {
          return res.status(401).json({ success: false, message: 'Invalid admin credentials.' });
        }
      }

      const adminIdentity = {
        id: 'admin-001',
        email: 'admin@store.com',
        role: 'superadmin'
      };

      const token = jwt.sign(adminIdentity, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: 'Admin session active.',
        token,
        admin: adminIdentity
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Server error.' });
    }
  });

  // Change Admin Password endpoint (Requires active Admin session)
  app.post('/api/admin/change-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body || {};

      if (!currentPassword || typeof currentPassword !== 'string' || !currentPassword.trim()) {
        return res.status(400).json({ success: false, message: 'Current password is required.' });
      }

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long.'
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'New password and confirmation password do not match.'
        });
      }

      const dbAdmin = await db.getAdminUser();
      let isCurrentValid = false;

      if (dbAdmin && dbAdmin.passwordHash) {
        isCurrentValid = bcrypt.compareSync(currentPassword, dbAdmin.passwordHash);
      } else {
        const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin@1234';
        isCurrentValid = (currentPassword === defaultAdminPassword);
      }

      if (!isCurrentValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect. Please verify and try again.'
        });
      }

      // Hash new password securely using bcrypt (10 rounds)
      const newPasswordHash = bcrypt.hashSync(newPassword, 10);
      await db.updateAdminPassword(newPasswordHash);

      const adminEmail = dbAdmin?.email || 'admin@store.com';
      const adminIdentity = {
        id: dbAdmin?.id || 'admin-001',
        email: adminEmail,
        role: 'superadmin'
      };

      const token = jwt.sign(adminIdentity, JWT_SECRET, { expiresIn: '7d' });

      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        success: true,
        message: 'Admin password changed successfully.',
        token,
        admin: adminIdentity
      });
    } catch (err: any) {
      return res.status(500).json({
        success: false,
        message: err.message || 'Server error changing admin password.'
      });
    }
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    res.clearCookie('admin_token');
    return res.json({ success: true, message: 'Logged out successfully.' });
  });

  app.get('/api/auth/me', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    return res.json({ success: true, admin: req.adminUser });
  });

  // --- IMAGE UPLOAD ENDPOINTS ---
  const handleImageUpload = (req: Request, res: Response) => {
    imageUpload.single('image')(req as any, res as any, async (err: any) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              success: false,
              message: 'Image size must be 5 MB or less.'
            });
          }
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || 'Unable to upload image. Please try again.'
        });
      }

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({
          success: false,
          message: 'No image file selected.'
        });
      }

      // Strict server-side secondary validation for 5 MB limit
      if (req.file.size > MAX_IMAGE_SIZE) {
        return res.status(400).json({
          success: false,
          message: 'Image size must be 5 MB or less.'
        });
      }

      const rawExt = path.extname(req.file.originalname).toLowerCase();
      const safeExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : '.jpg';
      const randomHex = crypto.randomBytes(8).toString('hex');
      const uniqueFilename = `fragrance-${Date.now()}-${randomHex}${safeExt}`;
      const detectedMime = req.file.mimetype || 'image/jpeg';

      try {
        const uploadResult = await uploadToGridFS(req.file.buffer, uniqueFilename, detectedMime);

        // Prewarm both WebP and original cache variants immediately in background
        prewarmImage(uploadResult.url);

        return res.status(200).json({
          success: true,
          message: 'Image uploaded successfully.',
          url: uploadResult.url,
          filename: uploadResult.filename,
          size: uploadResult.size,
          mimetype: uploadResult.mimetype
        });
      } catch (uploadErr: any) {
        console.error('[GridFS Upload Error]:', uploadErr);
        return res.status(500).json({
          success: false,
          message: 'Failed to persist image to database storage. Please try again.'
        });
      }
    });
  };

  app.post('/api/upload', handleImageUpload);
  app.post('/api/admin/upload', requireAdmin, handleImageUpload);

  // 2. PRODUCTS ENDPOINTS
  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const {
        search,
        category,
        gender,
        fragranceType,
        minPrice,
        maxPrice,
        inStockOnly,
        sortBy,
        includeInactive,
        collectionPlacement
      } = req.query;

      const products = await db.getProducts({
        search: search ? String(search) : undefined,
        category: category ? String(category) : undefined,
        gender: gender ? String(gender) : undefined,
        fragranceType: fragranceType ? String(fragranceType) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        inStockOnly: inStockOnly === 'true',
        sortBy: sortBy ? String(sortBy) : undefined,
        includeInactive: includeInactive === 'true',
        collectionPlacement: collectionPlacement ? String(collectionPlacement) : undefined
      });

      return res.json({ success: true, count: products.length, products });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch products');
    }
  });

  // Bestsellers Endpoint (supports both /api/v1/products/bestsellers and /api/products/bestsellers)
  const getBestsellersHandler = async (req: Request, res: Response) => {
    try {
      let limit: number | undefined;
      if (req.query.limit) {
        const parsed = parseInt(String(req.query.limit), 10);
        if (!isNaN(parsed) && parsed > 0) {
          limit = Math.min(parsed, 20);
        }
      }

      const data = await db.getBestSellersData(limit);
      return res.json({
        success: true,
        enabled: data.enabled,
        title: data.sectionTitle,
        displayMode: data.displayMode,
        count: data.products.length,
        products: data.products,
        data: data.products
      });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch bestsellers');
    }
  };

  app.get('/api/products/bestsellers', getBestsellersHandler);
  app.get('/api/v1/products/bestsellers', getBestsellersHandler);

  // --- ADMIN BESTSELLERS MANAGEMENT ENDPOINTS ---
  app.get('/api/admin/bestsellers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = await db.getBestSellersConfig();
      const allProducts = await db.getProducts({ includeInactive: true });
      return res.json({
        success: true,
        config,
        products: allProducts
      });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch bestsellers config.');
    }
  });

  app.put('/api/admin/bestsellers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const payload = req.body || {};
      const updatedConfig = await db.updateBestSellersConfig(payload);
      return res.json({
        success: true,
        message: 'Best Sellers settings updated successfully.',
        config: updatedConfig
      });
    } catch (err: any) {
      return sendError(res, err, 'Failed to update bestsellers settings.');
    }
  });

  app.post('/api/admin/bestsellers/products', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { productId } = req.body || {};
      if (!productId) {
        return res.status(400).json({ success: false, message: 'Product ID is required.' });
      }
      const config = await db.getBestSellersConfig();
      if (config.manualProductIds.includes(productId)) {
        return res.json({ success: true, message: 'Product is already in Best Sellers list.', config });
      }
      const updatedConfig = await db.updateBestSellersConfig({
        manualProductIds: [...config.manualProductIds, productId]
      });
      return res.json({
        success: true,
        message: 'Product added to Best Sellers list.',
        config: updatedConfig
      });
    } catch (err: any) {
      return sendError(res, err, 'Failed to add product.');
    }
  });

  app.delete('/api/admin/bestsellers/products/:productId', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { productId } = req.params;
      const config = await db.getBestSellersConfig();
      const updatedManualIds = config.manualProductIds.filter(id => id !== productId);
      const updatedConfig = await db.updateBestSellersConfig({
        manualProductIds: updatedManualIds
      });
      return res.json({
        success: true,
        message: 'Product removed from Best Sellers list.',
        config: updatedConfig
      });
    } catch (err: any) {
      return sendError(res, err, 'Failed to remove product.');
    }
  });

  app.get('/api/products/:idOrSlug', async (req: Request, res: Response) => {
    try {
      const product = await db.getProductByIdOrSlug(req.params.idOrSlug);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      return res.json({ success: true, product });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch product');
    }
  });

  app.post('/api/products', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const productData = req.body;
      if (!productData.name || productData.price === undefined || !productData.category) {
        return res.status(400).json({ success: false, message: 'Product name, price, and category are required.' });
      }

      const created = await db.createProduct(productData);
      return res.status(201).json({ success: true, message: 'Product created successfully.', product: created });
    } catch (err: any) {
      return sendError(res, err, 'Failed to create product');
    }
  });

  app.put('/api/products/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await db.updateProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      return res.json({ success: true, message: 'Product updated successfully.', product: updated });
    } catch (err: any) {
      return sendError(res, err, 'Failed to update product');
    }
  });

  app.delete('/api/products/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await db.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      return res.json({ success: true, message: 'Product deleted permanently.' });
    } catch (err: any) {
      return sendError(res, err, 'Failed to delete product');
    }
  });

  // Admin Products Route Aliases
  app.get('/api/admin/products', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const products = await db.getProducts({ includeInactive: true });
      return res.json({ success: true, count: products.length, products });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch admin products');
    }
  });

  app.post('/api/admin/products', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const productData = req.body;
      if (!productData.name || productData.price === undefined || !productData.category) {
        return res.status(400).json({ success: false, message: 'Product name, price, and category are required.' });
      }
      const created = await db.createProduct(productData);
      return res.status(201).json({ success: true, message: 'Product created successfully.', product: created });
    } catch (err: any) {
      return sendError(res, err, 'Failed to create product');
    }
  });

  app.put('/api/admin/products/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await db.updateProduct(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      return res.json({ success: true, message: 'Product updated successfully.', product: updated });
    } catch (err: any) {
      return sendError(res, err, 'Failed to update product');
    }
  });

  app.delete('/api/admin/products/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await db.deleteProduct(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      return res.json({ success: true, message: 'Product deleted permanently.' });
    } catch (err: any) {
      return sendError(res, err, 'Failed to delete product');
    }
  });

  app.patch('/api/products/:id/stock', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { stock } = req.body;
      if (stock === undefined || isNaN(Number(stock))) {
        return res.status(400).json({ success: false, message: 'Valid stock integer is required.' });
      }

      const updated = await db.updateStock(req.params.id, Number(stock));
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      return res.json({ success: true, message: 'Stock updated successfully.', product: updated });
    } catch (err: any) {
      return sendError(res, err, 'Failed to update stock');
    }
  });

  // 3. ORDERS ENDPOINTS
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const { customer, shippingAddress, items } = req.body;

      if (!customer?.fullName || !customer?.phone || !customer?.email) {
        return res.status(400).json({ success: false, message: 'Customer name, phone, and email are required.' });
      }

      if (!shippingAddress?.address || !shippingAddress?.city) {
        return res.status(400).json({ success: false, message: 'Shipping address and city are required.' });
      }

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Cart cannot be empty.' });
      }

      const createdOrder = await db.createOrder({ customer, shippingAddress, items });
      return res.status(201).json({
        success: true,
        message: 'Order created successfully.',
        order: createdOrder
      });
    } catch (err: any) {
      return sendError(res, err, 'Failed to place order.');
    }
  });

  app.get('/api/orders', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, status } = req.query;
      const orders = await db.getOrders({
        search: search ? String(search) : undefined,
        status: status ? String(status) : undefined
      });
      return res.json({ success: true, count: orders.length, orders });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch orders');
    }
  });

  app.get('/api/orders/:idOrNumber', async (req: Request, res: Response) => {
    try {
      const order = await db.getOrderByIdOrNumber(req.params.idOrNumber);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found.' });
      }
      return res.json({ success: true, order });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch order');
    }
  });

  app.patch('/api/orders/:id/status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, note } = req.body || {};
      const validStatuses: OrderStatus[] = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

      const currentOrder = await db.getOrderByIdOrNumber(req.params.id);
      if (!currentOrder) {
        return res.status(404).json({ success: false, message: 'Order record not found in database.' });
      }

      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: `Invalid status. Allowed: ${validStatuses.join(', ')}` });
      }

      const targetStatus: OrderStatus = status || currentOrder.orderStatus;
      const sanitizedNote = typeof note === 'string' ? note.trim() : undefined;

      const updatedOrder = await db.updateOrderStatus(req.params.id, targetStatus, sanitizedNote);
      if (!updatedOrder) {
        return res.status(404).json({ success: false, message: 'Order record not found.' });
      }

      return res.json({
        success: true,
        message: sanitizedNote 
          ? `Order lifecycle updated to ${targetStatus} with note recorded.` 
          : `Order status updated to ${targetStatus}.`,
        order: updatedOrder
      });
    } catch (err: any) {
      return sendError(res, err, 'Failed to update order status');
    }
  });

  // 4. CUSTOMERS ENDPOINTS
  app.get('/api/customers', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const customers = await db.getCustomers(search);
      return res.json({ success: true, count: customers.length, customers });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch customers');
    }
  });

  app.get('/api/customers/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const customer = await db.getCustomerById(req.params.id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found.' });
      }

      const customerOrders = await db.getOrders({ search: customer.email });
      return res.json({ success: true, customer, orders: customerOrders });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch customer');
    }
  });

  // 5. CONTACT MESSAGES
  app.post('/api/contact', async (req: Request, res: Response) => {
    try {
      const { fullName, email, phone, subject, message } = req.body;
      if (!fullName || !email || !message) {
        return res.status(400).json({ success: false, message: 'Full name, email, and message are required.' });
      }

      const createdMsg = await db.createContactMessage({ fullName, email, phone: phone || '', subject: subject || 'General Inquiry', message });
      return res.status(201).json({ success: true, message: 'Thank you for contacting Al-Mu\'attar. We will get back to you shortly.', contact: createdMsg });
    } catch (err: any) {
      return sendError(res, err, 'Failed to submit message');
    }
  });

  app.get('/api/contact', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const search = req.query.search ? String(req.query.search) : undefined;
      const messages = await db.getContactMessages(search);
      return res.json({ success: true, count: messages.length, messages });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch contact messages');
    }
  });

  app.patch('/api/contact/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { isRead } = req.body;
      const updated = await db.markMessageRead(req.params.id, Boolean(isRead));
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Message not found.' });
      }
      return res.json({ success: true, message: 'Message updated.', contact: updated });
    } catch (err: any) {
      return sendError(res, err, 'Failed to mark message');
    }
  });

  app.delete('/api/contact/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deleted = await db.deleteContactMessage(req.params.id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Message not found.' });
      }
      return res.json({ success: true, message: 'Message deleted successfully.' });
    } catch (err: any) {
      return sendError(res, err, 'Failed to delete message');
    }
  });

  // 6. NEWSLETTER
  app.post('/api/newsletter', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
      }

      await db.addNewsletterSubscriber(email);
      return res.json({ success: true, message: 'Welcome to Al-Mu\'attar Privé Club. You are now subscribed.' });
    } catch (err: any) {
      return sendError(res, err, 'Failed to subscribe');
    }
  });

  // 7. ADMIN STATS
  app.get('/api/admin/stats', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await db.getAdminStats();
      return res.json({ success: true, stats });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch admin stats');
    }
  });

  // 8. SETTINGS
  app.get('/api/settings', async (req: Request, res: Response) => {
    try {
      const settings = await db.getSettings();
      return res.json({ success: true, settings });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch settings');
    }
  });

  app.put('/api/settings', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await db.updateSettings(req.body);
      if (updated) {
        prewarmAllCriticalImages(updated);
      }
      return res.json({ success: true, message: 'Store settings updated successfully.', settings: updated });
    } catch (err: any) {
      return sendError(res, err, 'Failed to update settings');
    }
  });

  // 9. ABOUT US CMS
  app.get('/api/about', async (req: Request, res: Response) => {
    try {
      const config = await db.getAboutUsConfig();
      return res.json({ success: true, config });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch about us content');
    }
  });

  app.get('/api/admin/about', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = await db.getAboutUsConfig();
      return res.json({ success: true, config });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch about us config');
    }
  });

  app.put('/api/admin/about', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await db.updateAboutUsConfig(req.body);
      return res.json({ success: true, message: 'About Us content updated successfully.', config: updated });
    } catch (err: any) {
      return sendError(res, err, 'Failed to update about us content');
    }
  });

  // 10. OUR COLLECTION CMS
  app.get('/api/our-collection/config', async (req: Request, res: Response) => {
    try {
      const config = await db.getOurCollectionConfig();
      return res.json({ success: true, config });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch Our Collection config');
    }
  });

  app.get('/api/admin/our-collection', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = await db.getOurCollectionConfig();
      return res.json({ success: true, config });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch Our Collection config');
    }
  });

  app.put('/api/admin/our-collection', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await db.updateOurCollectionConfig(req.body);
      if (updated) {
        prewarmAllCriticalImages({ ourCollection: updated });
      }
      return res.json({ success: true, message: 'Our Collection config updated successfully.', config: updated });
    } catch (err: any) {
      return sendError(res, err, 'Failed to update Our Collection config');
    }
  });

  // 10B. SHOP COLLECTION CMS
  app.get('/api/shop/config', async (req: Request, res: Response) => {
    try {
      const config = await db.getShopCollectionConfig();
      return res.json({ success: true, config });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch Shop Collection config');
    }
  });

  app.get('/api/admin/shop-config', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = await db.getShopCollectionConfig();
      return res.json({ success: true, config });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch Shop Collection config');
    }
  });

  app.put('/api/admin/shop-config', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const updated = await db.updateShopCollectionConfig(req.body);
      if (updated) {
        prewarmAllCriticalImages({ shopCollection: updated });
      }
      return res.json({ success: true, message: 'Shop Collection banners updated successfully.', config: updated });
    } catch (err: any) {
      return sendError(res, err, 'Failed to update Shop Collection config');
    }
  });

  // 11. PRODUCT REVIEWS ENDPOINTS
  app.get('/api/products/:productId/reviews', async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const reviews = await db.getProductReviews(productId);
      return res.json({ success: true, count: reviews.length, reviews });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch product reviews');
    }
  });

  app.post('/api/products/:productId/reviews', async (req: Request, res: Response) => {
    try {
      const { productId } = req.params;
      const { customerName, customerEmail, rating, title, comment } = req.body;

      if (!customerName || !customerName.trim()) {
        return res.status(400).json({ success: false, message: 'Your name is required.' });
      }

      if (!customerEmail || !customerEmail.includes('@')) {
        return res.status(400).json({ success: false, message: 'A valid email address is required.' });
      }

      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) {
        return res.status(400).json({ success: false, message: 'Please select a star rating between 1 and 5.' });
      }

      if (!comment || !comment.trim() || comment.trim().length < 5) {
        return res.status(400).json({ success: false, message: 'Please share a review comment (minimum 5 characters).' });
      }

      const review = await db.createProductReview({
        productId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim(),
        rating: numRating,
        title: title ? String(title).trim() : '',
        comment: comment.trim()
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you! Your fragrance review has been published.',
        review
      });
    } catch (err: any) {
      const msg = err.message || 'Failed to submit review';
      const status = msg.includes('already submitted') ? 409 : msg.includes('not found') ? 404 : 400;
      return res.status(status).json({ success: false, message: msg });
    }
  });

  // Admin Reviews
  app.get('/api/admin/reviews', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { search, rating, productId } = req.query;
      const reviews = await db.getAllReviews({
        search: search ? String(search) : undefined,
        rating: rating ? Number(rating) : undefined,
        productId: productId ? String(productId) : undefined
      });
      return res.json({ success: true, count: reviews.length, reviews });
    } catch (err: any) {
      return sendError(res, err, 'Failed to fetch admin reviews');
    }
  });

  app.delete('/api/admin/reviews/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const deleted = await db.deleteProductReview(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Review not found.' });
      }
      return res.json({ success: true, message: 'Review deleted successfully.' });
    } catch (err: any) {
      return sendError(res, err, 'Failed to delete review');
    }
  });

  // 10. MIGRATION & DATABASE STATUS (ADMIN RESTRICTED)
  app.get('/api/admin/database-status', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const status = await getMongoStatus();
      return res.json({
        success: true,
        ...status,
        storageMode: status.isConnected 
          ? 'MongoDB Atlas (Single Source of Truth)' 
          : hasMongoConfigured() 
          ? 'MongoDB Atlas (Reconnecting / Awaiting IP Allowlist)' 
          : 'Local File Persistence (Dev Mode)',
        instructions: !status.isConnected && process.env.MONGODB_URI
          ? `MongoDB Atlas URI is loaded, but the database cluster rejected the connection. Add outbound IP ${status.outboundIp}/32 to your Atlas Network Access IP Access List.`
          : null
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Reconnect database endpoint
  app.post('/api/admin/reconnect-database', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const connected = await connectMongo();
      if (connected) {
        await db.initialize();
      }
      const status = await getMongoStatus();
      return res.json({
        success: true,
        message: connected
          ? 'Successfully connected and authenticated with MongoDB Atlas.'
          : `Could not connect to MongoDB Atlas. Add ${status.outboundIp}/32 to your Atlas IP Access List.`,
        ...status
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });

  // Trigger migration manually from admin if needed
  app.post('/api/admin/migrate-database', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!isMongoConnected()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot run migration: MongoDB is not connected. Please verify your Atlas connection and IP Access List first.'
        });
      }
      const summary = await runDatabaseJsonMigration();
      return res.json({ success: true, message: 'Migration executed.', summary });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'Migration failed.' });
    }
  });

  // --- VITE / STATIC SERVING WITH HTML BOOTSTRAP INJECTION ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    // Custom HTML serving middleware to inject store bootstrap & high-priority image preloads
    app.use(async (req: Request, res: Response, next: NextFunction) => {
      const url = req.originalUrl || req.url;
      const pathname = (req.path || url.split('?')[0] || '').toLowerCase();
      // Pass through API, assets, internal Vite requests, uploads, etc.
      if (
        pathname.startsWith('/api') ||
        pathname.startsWith('/@') ||
        pathname.startsWith('/src') ||
        pathname.startsWith('/node_modules') ||
        pathname.startsWith('/uploads') ||
        (/\.[a-z0-9]+$/i.test(pathname) && !pathname.endsWith('.html'))
      ) {
        return next();
      }

      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let template = fs.readFileSync(indexPath, 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const settings = await db.getSettings();
        const html = injectStoreBootstrap(template, settings);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(html);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      try {
        const indexPath = path.join(distPath, 'index.html');
        const template = fs.readFileSync(indexPath, 'utf-8');
        const settings = await db.getSettings();
        const html = injectStoreBootstrap(template, settings);
        res.status(200).set({ 'Content-Type': 'text/html; charset=utf-8' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✨ Al-Mu'attar Full-Stack Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
