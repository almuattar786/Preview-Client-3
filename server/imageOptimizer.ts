import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Request, Response } from 'express';
import { getGridFSBuffer, getGridFSFileInfo, GridFSFileInfo } from './gridfs';

export interface ImageCacheEntry {
  buffer: Buffer;
  mimeType: string;
  etag: string;
  lastModified: string;
  length: number;
  width?: number;
  height?: number;
  format: string;
}

// Memory budget in bytes: 64 MB
const MAX_MEMORY_CACHE_BYTES = 64 * 1024 * 1024;
let currentCacheBytes = 0;

// LRU cache mapping cacheKey -> ImageCacheEntry
const memoryCache = new Map<string, ImageCacheEntry>();

// In-flight promise deduplication to prevent duplicate sharp transformations or duplicate DB reads
const inFlightRequests = new Map<string, Promise<ImageCacheEntry | null>>();

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

/**
 * Access cached image and maintain LRU order
 */
export function getCachedImage(key: string): ImageCacheEntry | undefined {
  const item = memoryCache.get(key);
  if (item) {
    // Refresh LRU position
    memoryCache.delete(key);
    memoryCache.set(key, item);
  }
  return item;
}

/**
 * Store image in cache while enforcing byte-size memory budget
 */
export function setCachedImage(key: string, entry: ImageCacheEntry) {
  // If replacing an existing key, subtract prior size
  const existing = memoryCache.get(key);
  if (existing) {
    currentCacheBytes -= existing.length;
    memoryCache.delete(key);
  }

  // Evict oldest entries until we have room
  while (currentCacheBytes + entry.length > MAX_MEMORY_CACHE_BYTES && memoryCache.size > 0) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey) {
      const evicted = memoryCache.get(oldestKey);
      if (evicted) {
        currentCacheBytes -= evicted.length;
      }
      memoryCache.delete(oldestKey);
    } else {
      break;
    }
  }

  memoryCache.set(key, entry);
  currentCacheBytes += entry.length;
}

/**
 * Clear a specific image or all variants of a filename from memory cache
 */
export function invalidateImageCache(filename: string) {
  const baseName = filename.split('?')[0].replace('/api/images/', '').replace('/uploads/', '');
  for (const key of Array.from(memoryCache.keys())) {
    if (key === baseName || key.startsWith(`${baseName}:`)) {
      const entry = memoryCache.get(key);
      if (entry) {
        currentCacheBytes -= entry.length;
      }
      memoryCache.delete(key);
    }
  }
}

export interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'original';
}

/**
 * Transform raw buffer into optimized WebP/JPEG/PNG buffer with sharp
 */
export async function optimizeBuffer(
  rawBuffer: Buffer,
  rawMimeType: string,
  options: ImageOptimizationOptions = {}
): Promise<{ buffer: Buffer; mimeType: string; format: string }> {
  try {
    const isSvg = rawMimeType === 'image/svg+xml' || rawBuffer.slice(0, 100).toString().includes('<svg');
    const isGif = rawMimeType === 'image/gif';

    // Return SVGs and animated GIFs directly without sharp transcoding
    if (isSvg) {
      return { buffer: rawBuffer, mimeType: 'image/svg+xml', format: 'svg' };
    }
    if (isGif && (!options.format || options.format === 'original')) {
      return { buffer: rawBuffer, mimeType: 'image/gif', format: 'gif' };
    }

    let pipeline = sharp(rawBuffer, { failOn: 'none' });

    // Handle orientation based on EXIF
    pipeline = pipeline.rotate();

    // Resize if requested
    if (options.width || options.height) {
      pipeline = pipeline.resize({
        width: options.width,
        height: options.height,
        fit: 'inside',
        withoutEnlargement: true
      });
    }

    const targetFormat = options.format || 'webp';
    const quality = options.quality || 82;

    if (targetFormat === 'webp') {
      pipeline = pipeline.webp({
        quality: options.quality || 80,
        effort: 2,
        smartSubsample: true
      });
      const optimized = await pipeline.toBuffer();
      return { buffer: optimized, mimeType: 'image/webp', format: 'webp' };
    } else if (targetFormat === 'avif') {
      pipeline = pipeline.avif({
        quality: Math.min(quality, 75),
        effort: 2
      });
      const optimized = await pipeline.toBuffer();
      return { buffer: optimized, mimeType: 'image/avif', format: 'avif' };
    } else if (targetFormat === 'jpeg') {
      pipeline = pipeline.jpeg({
        quality,
        mozjpeg: true
      });
      const optimized = await pipeline.toBuffer();
      return { buffer: optimized, mimeType: 'image/jpeg', format: 'jpeg' };
    } else if (targetFormat === 'png') {
      pipeline = pipeline.png({
        compressionLevel: 6,
        palette: true
      });
      const optimized = await pipeline.toBuffer();
      return { buffer: optimized, mimeType: 'image/png', format: 'png' };
    }

    // Default: WebP
    pipeline = pipeline.webp({ quality: 80, effort: 2 });
    const optimized = await pipeline.toBuffer();
    return { buffer: optimized, mimeType: 'image/webp', format: 'webp' };
  } catch (err) {
    console.warn('[ImageOptimizer] Optimization failed, falling back to original:', (err as any)?.message);
    return { buffer: rawBuffer, mimeType: rawMimeType, format: 'original' };
  }
}

/**
 * Resolve an image buffer from GridFS or local filesystem fallback with caching and in-flight deduplication
 */
export async function getOptimizedImage(
  filename: string,
  options: ImageOptimizationOptions = {}
): Promise<ImageCacheEntry | null> {
  const targetFormat = options.format || 'webp';
  const widthKey = options.width ? `w${options.width}` : 'orig';
  const qualityKey = options.quality ? `q${options.quality}` : 'q82';
  const cacheKey = `${filename}:${targetFormat}:${widthKey}:${qualityKey}`;

  // 1. Check in-memory cache
  const cached = getCachedImage(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Check if this exact image request is already in-flight
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey)!;
  }

  // 3. Initiate resolution and optimization with in-flight deduplication
  const fetchPromise = (async (): Promise<ImageCacheEntry | null> => {
    try {
      let rawBuffer: Buffer | null = null;
      let rawMime = 'image/jpeg';
      let uploadTimestamp = Date.now();
      let fileId = filename;

      // Try GridFS first (primary storage)
      const gridResult = await getGridFSBuffer(filename);
      if (gridResult) {
        rawBuffer = gridResult.buffer;
        rawMime = gridResult.file.metadata?.mimetype || gridResult.file.contentType || 'image/jpeg';
        uploadTimestamp = new Date(gridResult.file.uploadDate).getTime();
        fileId = gridResult.file._id ? gridResult.file._id.toString() : filename;
      } else {
        // Local filesystem fallback
        const localPath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(localPath)) {
          rawBuffer = await fs.promises.readFile(localPath);
          const stat = await fs.promises.stat(localPath);
          uploadTimestamp = stat.mtimeMs;
          const ext = path.extname(filename).toLowerCase();
          rawMime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
        }
      }

      if (!rawBuffer) {
        return null;
      }

      // Optimize image buffer
      let optimizedResult: { buffer: Buffer; mimeType: string; format: string };
      if (targetFormat === 'original') {
        optimizedResult = { buffer: rawBuffer, mimeType: rawMime, format: 'original' };
      } else {
        optimizedResult = await optimizeBuffer(rawBuffer, rawMime, options);
      }

      const etag = `"${fileId}-${uploadTimestamp}-${targetFormat}-${widthKey}"`;
      const lastModified = new Date(uploadTimestamp).toUTCString();

      const entry: ImageCacheEntry = {
        buffer: optimizedResult.buffer,
        mimeType: optimizedResult.mimeType,
        etag,
        lastModified,
        length: optimizedResult.buffer.length,
        format: optimizedResult.format
      };

      // Store in memory cache
      setCachedImage(cacheKey, entry);

      return entry;
    } catch (err) {
      console.error(`[ImageOptimizer] Error processing image "${filename}":`, err);
      return null;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

/**
 * Handle HTTP request for `/api/images/:filename` or `/uploads/:filename`
 */
export async function handleImageRequest(req: Request, res: Response) {
  const rawFilename = req.params.filename;
  if (!rawFilename || rawFilename.includes('..') || rawFilename.includes('/') || rawFilename.includes('\\')) {
    return res.status(400).json({ success: false, message: 'Invalid image filename parameter.' });
  }

  // Parse query parameters
  const widthQuery = req.query.w || req.query.width;
  const width = widthQuery ? parseInt(String(widthQuery), 10) : undefined;
  const qualityQuery = req.query.q || req.query.quality;
  const quality = qualityQuery ? parseInt(String(qualityQuery), 10) : undefined;
  
  // Format negotiation: Standardize on WebP for instant delivery (supported across 97%+ browsers)
  const acceptHeader = req.headers.accept || '';
  const explicitFormat = req.query.format as string | undefined;
  
  let targetFormat: 'webp' | 'avif' | 'jpeg' | 'png' | 'original' = 'webp';
  if (explicitFormat === 'original' || explicitFormat === 'raw') {
    targetFormat = 'original';
  } else if (explicitFormat === 'avif') {
    targetFormat = 'avif';
  } else if (explicitFormat === 'jpeg' || explicitFormat === 'jpg') {
    targetFormat = 'jpeg';
  } else if (explicitFormat === 'png') {
    targetFormat = 'png';
  } else if (explicitFormat === 'webp' || acceptHeader.includes('image/webp') || acceptHeader.includes('*/*') || !acceptHeader) {
    targetFormat = 'webp';
  } else {
    targetFormat = 'original';
  }

  const options: ImageOptimizationOptions = {
    width: width && !isNaN(width) && width > 0 && width <= 3840 ? width : undefined,
    quality: quality && !isNaN(quality) && quality >= 20 && quality <= 100 ? quality : 80,
    format: targetFormat
  };

  const imageEntry = await getOptimizedImage(rawFilename, options);

  if (!imageEntry) {
    return res.status(404).json({
      success: false,
      message: 'Image not found.'
    });
  }

  // Set high-performance HTTP cache headers
  res.setHeader('Content-Type', imageEntry.mimeType);
  res.setHeader('Content-Length', imageEntry.length);
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Vary', 'Accept');
  res.setHeader('ETag', imageEntry.etag);
  res.setHeader('Last-Modified', imageEntry.lastModified);

  // Check 304 Not Modified
  if (req.headers['if-none-match'] === imageEntry.etag) {
    return res.status(304).end();
  }

  return res.end(imageEntry.buffer);
}

/**
 * Prewarm an image (fetching from GridFS and creating optimized WebP versions in RAM)
 */
export async function prewarmImage(imagePath?: string) {
  if (!imagePath || typeof imagePath !== 'string') return;
  if (!imagePath.startsWith('/api/images/') && !imagePath.startsWith('/uploads/')) return;
  const rawFilename = imagePath.replace('/api/images/', '').replace('/uploads/', '').split('?')[0];
  if (!rawFilename || rawFilename.includes('..') || rawFilename.includes('/') || rawFilename.includes('\\')) return;

  try {
    // Prewarm both WebP and original
    await Promise.all([
      getOptimizedImage(rawFilename, { format: 'webp' }),
      getOptimizedImage(rawFilename, { format: 'original' })
    ]);
  } catch (err) {
    // Silent catch
  }
}

/**
 * Prewarm all critical images (Hero, Logo, Collection Banners, Categories, Top Best Sellers)
 */
export async function prewarmAllCriticalImages(settings: any, products: any[] = []) {
  try {
    const urlsToWarm = new Set<string>();

    if (settings?.heroImageUrl) urlsToWarm.add(settings.heroImageUrl);
    if (settings?.logoUrl) urlsToWarm.add(settings.logoUrl);

    // Categories
    if (Array.isArray(settings?.categories)) {
      for (const cat of settings.categories) {
        if (cat.image) urlsToWarm.add(cat.image);
      }
    }

    // Collections
    if (settings?.collections) {
      if (settings.collections.menImage) urlsToWarm.add(settings.collections.menImage);
      if (settings.collections.womenImage) urlsToWarm.add(settings.collections.womenImage);
      if (settings.collections.unisexImage) urlsToWarm.add(settings.collections.unisexImage);
    }

    // Our Collection Banners
    if (settings?.ourCollection) {
      if (settings.ourCollection.heroImageUrl) urlsToWarm.add(settings.ourCollection.heroImageUrl);
      if (settings.ourCollection.defaultBanner?.imageUrl) urlsToWarm.add(settings.ourCollection.defaultBanner.imageUrl);
      if (settings.ourCollection.menBanner?.imageUrl) urlsToWarm.add(settings.ourCollection.menBanner.imageUrl);
      if (settings.ourCollection.womenBanner?.imageUrl) urlsToWarm.add(settings.ourCollection.womenBanner.imageUrl);
      if (settings.ourCollection.unisexBanner?.imageUrl) urlsToWarm.add(settings.ourCollection.unisexBanner.imageUrl);
    }

    // Shop Collection Banners
    if (settings?.shopCollection) {
      if (settings.shopCollection.defaultBanner?.imageUrl) urlsToWarm.add(settings.shopCollection.defaultBanner.imageUrl);
      if (settings.shopCollection.menBanner?.imageUrl) urlsToWarm.add(settings.shopCollection.menBanner.imageUrl);
      if (settings.shopCollection.womenBanner?.imageUrl) urlsToWarm.add(settings.shopCollection.womenBanner.imageUrl);
      if (settings.shopCollection.unisexBanner?.imageUrl) urlsToWarm.add(settings.shopCollection.unisexBanner.imageUrl);
    }

    // Top products
    if (Array.isArray(products)) {
      for (const p of products) {
        if (Array.isArray(p.images)) {
          for (const img of p.images) {
            if (typeof img === 'string') urlsToWarm.add(img);
          }
        }
      }
    }

    const gridUrls = Array.from(urlsToWarm).filter(
      (url) => url.startsWith('/api/images/') || url.startsWith('/uploads/')
    );

    if (gridUrls.length > 0) {
      await Promise.all(gridUrls.map((url) => prewarmImage(url)));
      console.log(`⚡ [ImageOptimizer] Pre-warmed ${gridUrls.length} critical images into memory cache.`);
    }
  } catch (err) {
    console.warn('[ImageOptimizer] Pre-warming notice:', (err as any)?.message);
  }
}
