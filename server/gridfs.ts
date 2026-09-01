import mongoose from 'mongoose';
import { Readable } from 'stream';

const BUCKET_NAME = 'product_images';
let cachedBucket: mongoose.mongo.GridFSBucket | null = null;

/**
 * Obtain the GridFSBucket instance tied to the active Mongoose database connection
 */
export function getGridFSBucket(): mongoose.mongo.GridFSBucket | null {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    cachedBucket = null;
    return null;
  }

  // Re-use or instantiate bucket using current active connection
  if (!cachedBucket || (cachedBucket as any).s?.db !== mongoose.connection.db) {
    cachedBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: BUCKET_NAME
    });
  }

  return cachedBucket;
}

export interface GridFSUploadResult {
  filename: string;
  fileId: string;
  size: number;
  mimetype: string;
  url: string;
}

/**
 * Upload an image buffer directly to MongoDB Atlas GridFS
 */
export async function uploadToGridFS(
  buffer: Buffer,
  filename: string,
  mimetype: string
): Promise<GridFSUploadResult> {
  const bucket = getGridFSBucket();
  if (!bucket) {
    throw new Error('Database connection is not ready. Unable to upload image to GridFS.');
  }

  return new Promise<GridFSUploadResult>((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        mimetype,
        contentType: mimetype,
        uploadedAt: new Date()
      }
    });

    const readable = new Readable();
    readable.push(buffer);
    readable.push(null);

    uploadStream.on('error', (err) => {
      reject(err);
    });

    uploadStream.on('finish', () => {
      const fileId = uploadStream.id ? uploadStream.id.toString() : '';
      metadataCache.set(filename, {
        _id: uploadStream.id,
        filename,
        length: buffer.length,
        chunkSize: 255 * 1024,
        uploadDate: new Date(),
        contentType: mimetype,
        metadata: {
          mimetype,
          uploadedAt: new Date()
        }
      });

      resolve({
        filename,
        fileId,
        size: buffer.length,
        mimetype,
        url: `/api/images/${filename}`
      });
    });

    readable.pipe(uploadStream);
  });
}

export interface GridFSFileInfo {
  _id: any;
  filename: string;
  length: number;
  chunkSize: number;
  uploadDate: Date;
  contentType?: string;
  metadata?: {
    mimetype?: string;
    uploadedAt?: Date;
  };
}

// In-memory metadata cache for fast repeated lookups without MongoDB find queries
const metadataCache = new Map<string, GridFSFileInfo>();

// In-flight read promises to prevent duplicate concurrent GridFS streams
const inFlightBufferFetches = new Map<string, Promise<{ file: GridFSFileInfo; buffer: Buffer } | null>>();

/**
 * Retrieve metadata for a file in GridFS with memory caching
 */
export async function getGridFSFileInfo(filename: string): Promise<GridFSFileInfo | null> {
  const cached = metadataCache.get(filename);
  if (cached) {
    return cached;
  }

  const bucket = getGridFSBucket();
  if (!bucket) {
    return null;
  }

  try {
    const files = await bucket.find({ filename }).limit(1).toArray();
    if (!files || files.length === 0) {
      return null;
    }

    const file = files[0] as unknown as GridFSFileInfo;
    metadataCache.set(filename, file);
    return file;
  } catch (err) {
    console.error(`[GridFS] Error finding file info for "${filename}":`, err);
    return null;
  }
}

/**
 * Read the entire GridFS file into a memory buffer with in-flight deduplication
 */
export async function getGridFSBuffer(
  filename: string
): Promise<{ file: GridFSFileInfo; buffer: Buffer } | null> {
  const inFlight = inFlightBufferFetches.get(filename);
  if (inFlight) {
    return inFlight;
  }

  const fetchPromise = (async () => {
    const bucket = getGridFSBucket();
    if (!bucket) {
      return null;
    }

    try {
      const file = await getGridFSFileInfo(filename);
      if (!file) {
        return null;
      }

      const downloadStream = bucket.openDownloadStreamByName(filename);

      return new Promise<{ file: GridFSFileInfo; buffer: Buffer } | null>((resolve) => {
        const chunks: Buffer[] = [];

        downloadStream.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        });

        downloadStream.on('end', () => {
          const completeBuffer = Buffer.concat(chunks);
          resolve({ file, buffer: completeBuffer });
        });

        downloadStream.on('error', (err) => {
          console.error(`[GridFS] Download stream error for "${filename}":`, err);
          resolve(null);
        });
      });
    } catch (err) {
      console.error(`[GridFS] Error reading buffer for "${filename}":`, err);
      return null;
    } finally {
      inFlightBufferFetches.delete(filename);
    }
  })();

  inFlightBufferFetches.set(filename, fetchPromise);
  return fetchPromise;
}

/**
 * Find and stream an image from MongoDB Atlas GridFS
 */
export async function getGridFSFile(
  filename: string
): Promise<{ file: GridFSFileInfo; stream: NodeJS.ReadableStream } | null> {
  const bucket = getGridFSBucket();
  if (!bucket) {
    return null;
  }

  try {
    const files = await bucket.find({ filename }).limit(1).toArray();
    if (!files || files.length === 0) {
      return null;
    }

    const file = files[0] as unknown as GridFSFileInfo;
    const downloadStream = bucket.openDownloadStreamByName(filename);

    return {
      file,
      stream: downloadStream
    };
  } catch (err) {
    console.error(`[GridFS] Error retrieving file "${filename}":`, err);
    return null;
  }
}

/**
 * Check if a file exists in the GridFS bucket
 */
export async function checkGridFSFileExists(filename: string): Promise<boolean> {
  const bucket = getGridFSBucket();
  if (!bucket) {
    return false;
  }

  try {
    const files = await bucket.find({ filename }).limit(1).toArray();
    return Boolean(files && files.length > 0);
  } catch {
    return false;
  }
}

/**
 * Delete a file from GridFS by filename
 */
export async function deleteFromGridFS(filename: string): Promise<boolean> {
  const bucket = getGridFSBucket();
  if (!bucket) {
    return false;
  }

  try {
    const files = await bucket.find({ filename }).limit(1).toArray();
    if (!files || files.length === 0) {
      return false;
    }

    await bucket.delete(files[0]._id);
    metadataCache.delete(filename);
    return true;
  } catch (err) {
    console.error(`[GridFS] Error deleting file "${filename}":`, err);
    return false;
  }
}
