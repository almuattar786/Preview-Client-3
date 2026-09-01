import { PrismaClient } from '@prisma/client';

let prismaInstance: PrismaClient | null = null;
let isConnected = false;
let lastConnectionError: string | null = null;

export function hasMySqlConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim());
}

export function isMySqlConnected(): boolean {
  return isConnected;
}

export function getPrisma(): PrismaClient {
  if (!prismaInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    const clientOptions: any = {
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
    };
    if (databaseUrl) {
      clientOptions.datasources = {
        db: {
          url: databaseUrl
        }
      };
    }
    prismaInstance = new (PrismaClient as any)(clientOptions);
  }
  return prismaInstance!;
}

export async function connectMySql(): Promise<boolean> {
  if (!hasMySqlConfigured()) {
    lastConnectionError = 'DATABASE_URL environment variable is not configured';
    isConnected = false;
    return false;
  }

  try {
    const client = getPrisma();
    // Test query to verify live connection to MySQL
    await client.$queryRaw`SELECT 1`;
    isConnected = true;
    lastConnectionError = null;
    console.log('✅ [MySQL / Prisma] Connected and authenticated successfully with Hostinger Managed MySQL.');
    return true;
  } catch (err: any) {
    isConnected = false;
    lastConnectionError = err?.message || 'Failed to connect to MySQL';
    console.error('⚠️ [MySQL / Prisma] Connection failed:', lastConnectionError);
    return false;
  }
}

export async function getMySqlStatus(): Promise<{
  isConnected: boolean;
  isConfigured: boolean;
  databaseUrlConfigured: boolean;
  lastError: string | null;
}> {
  if (hasMySqlConfigured() && !isConnected) {
    // Attempt ping
    await connectMySql();
  }

  return {
    isConnected: isMySqlConnected(),
    isConfigured: hasMySqlConfigured(),
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    lastError: lastConnectionError
  };
}

export async function disconnectMySql(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    isConnected = false;
    prismaInstance = null;
    console.log('🔌 [MySQL / Prisma] Disconnected.');
  }
}
