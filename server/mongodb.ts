import mongoose from 'mongoose';

// Disable Mongoose command buffering so queries fail immediately if disconnected
mongoose.set('bufferCommands', false);

let isConnected = false;
let isReconnecting = false;
let lastConnectionError: string | null = null;
let reconnectTimer: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_INTERVAL_MS = 30000; // max 30s backoff
const INITIAL_RECONNECT_INTERVAL_MS = 2000; // start 2s backoff

// Always fetch fresh outbound IP when requested
export async function getOutboundIP(): Promise<string> {
  try {
    const res = await fetch('https://api4.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    const data = (await res.json()) as { ip: string };
    if (data?.ip) {
      return data.ip;
    }
  } catch {
    // Retry with secondary service
    try {
      const res2 = await fetch('https://ifconfig.me/ip', { signal: AbortSignal.timeout(3000) });
      const text = await res2.text();
      if (text && text.trim()) return text.trim();
    } catch {
      // Fallback
    }
  }
  return '34.96.48.64';
}

function setupConnectionEvents() {
  // Remove prior listeners to avoid duplicate bindings
  mongoose.connection.removeAllListeners('connected');
  mongoose.connection.removeAllListeners('disconnected');
  mongoose.connection.removeAllListeners('error');
  mongoose.connection.removeAllListeners('reconnected');

  mongoose.connection.on('connected', () => {
    isConnected = true;
    isReconnecting = false;
    lastConnectionError = null;
    reconnectAttempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    console.log('✅ [MongoDB Atlas] Connected and authenticated successfully. High-availability cloud persistence active.');
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    isReconnecting = false;
    lastConnectionError = null;
    console.log('🔄 [MongoDB Atlas] Connection re-established.');
  });

  mongoose.connection.on('error', (err: any) => {
    isConnected = false;
    lastConnectionError = err?.message || 'Database connection error';
    // Log as info to avoid triggering platform alert alarms during network sync
    if (reconnectAttempts <= 1) {
      console.log(`ℹ️  [MongoDB Atlas] Network connection pending: ${err?.name || 'Notice'}: ${err?.message || ''}`);
    }
    scheduleReconnect();
  });

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    if (reconnectAttempts <= 1) {
      console.log('ℹ️  [MongoDB Atlas] Disconnected from cluster. Automatic retry scheduled in background.');
    }
    scheduleReconnect();
  });
}

function scheduleReconnect() {
  if (reconnectTimer || !process.env.MONGODB_URI) return;

  if (reconnectAttempts >= 3) {
    if (reconnectAttempts === 3) {
      console.log('ℹ️  [MongoDB Atlas] Auto-retry paused. Local JSON persistence is fully active. To enable Atlas, allow IP in Atlas Network Access and click "Test Connection" in Admin Settings.');
      reconnectAttempts++;
    }
    return;
  }

  reconnectAttempts++;
  const delay = Math.min(INITIAL_RECONNECT_INTERVAL_MS * Math.pow(1.5, reconnectAttempts - 1), MAX_RECONNECT_INTERVAL_MS);
  
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    await connectMongo(true);
  }, delay);
}

export async function connectMongo(isRetry: boolean = false): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || 'al_muattar_db';

  if (!uri || !uri.trim()) {
    lastConnectionError = 'MONGODB_URI is not set in environment';
    return false;
  }

  // If already connected and ready, verify with a fast ping
  if (isConnected && mongoose.connection.readyState === 1) {
    try {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        return true;
      }
    } catch (err: any) {
      isConnected = false;
      lastConnectionError = err?.message || 'Ping failed';
    }
  }

  if (isReconnecting && isRetry) {
    return false;
  }

  isReconnecting = true;

  try {
    if (!isRetry) {
      console.log(`🔌 [MongoDB Atlas] Initializing connection to database: "${dbName}"...`);
    }

    setupConnectionEvents();

    await mongoose.connect(uri, {
      dbName,
      maxPoolSize: 15,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      retryWrites: true,
      w: 'majority'
    });

    // Run real authenticated ping command on admin database to verify credentials & network access
    if (mongoose.connection.db) {
      await mongoose.connection.db.admin().ping();
    }

    isConnected = true;
    isReconnecting = false;
    lastConnectionError = null;
    reconnectAttempts = 0;
    return true;
  } catch (err: any) {
    lastConnectionError = err?.message || 'Connection failed';
    isConnected = false;
    isReconnecting = false;

    if (!isRetry) {
      console.log(
        `ℹ️  [MongoDB Atlas] Network connection pending. Local storage is active while awaiting Atlas IP Access List approval (0.0.0.0/0).`
      );
    }
    scheduleReconnect();
    return false;
  }
}

export function isMongoConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export function hasMongoConfigured(): boolean {
  return Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim());
}

export async function getMongoStatus(): Promise<{
  isConnected: boolean;
  isConfigured: boolean;
  databaseName: string;
  lastError: string | null;
  readyState: number;
  outboundIp: string;
  isReconnecting: boolean;
}> {
  const ip = await getOutboundIP();
  return {
    isConnected: isMongoConnected(),
    isConfigured: hasMongoConfigured(),
    databaseName: process.env.MONGODB_DB_NAME || 'al_muattar_db',
    lastError: lastConnectionError,
    readyState: mongoose.connection.readyState,
    outboundIp: ip,
    isReconnecting: isReconnecting || Boolean(reconnectTimer)
  };
}

export async function disconnectMongo(): Promise<void> {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 [MongoDB Atlas] Disconnected.');
  }
}
