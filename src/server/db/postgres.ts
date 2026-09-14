import { Pool, PoolClient } from 'pg';

let pgPool: Pool | null = null;
let isPostgresConnected = false;

/**
 * Returns a PostgreSQL / Supabase connection pool instance.
 * Automatically checks SUPABASE_DATABASE_URL, DATABASE_URL, and POSTGRES_URL.
 */
export function getPostgresPool(): Pool | null {
  if (pgPool) return pgPool;

  const connectionString =
    process.env.SUPABASE_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (connectionString || process.env.PGHOST) {
    try {
      const isSsl =
        connectionString?.includes('supabase.co') ||
        connectionString?.includes('pooler.supabase.com') ||
        process.env.NODE_ENV === 'production';

      pgPool = new Pool({
        connectionString: connectionString || undefined,
        host: process.env.PGHOST || 'localhost',
        port: parseInt(process.env.PGPORT || '5432', 10),
        user: process.env.PGUSER || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'postgres',
        ssl: isSsl ? { rejectUnauthorized: false } : false,
        max: 15,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      pgPool.on('error', (err) => {
        console.warn('[Supabase/PostgreSQL Pool Warning]:', err.message);
      });

      return pgPool;
    } catch (e) {
      console.warn('[Supabase/PostgreSQL] Initialization error:', e);
      return null;
    }
  }

  return null;
}

/**
 * Checks connection to Supabase / PostgreSQL database.
 */
export async function initPostgresDatabase(): Promise<boolean> {
  const pool = getPostgresPool();
  if (!pool) {
    console.log('[Database] Ready for Supabase. No active connection string detected yet (SUPABASE_DATABASE_URL / DATABASE_URL). Using local store.');
    isPostgresConnected = false;
    return false;
  }

  let client: PoolClient | null = null;
  try {
    client = await pool.connect();
    console.log('[Database] Successfully connected to Supabase / PostgreSQL database.');
    isPostgresConnected = true;
    return true;
  } catch (err: any) {
    console.warn('[Database] Remote Supabase connection test failed. Fallback to active local store:', err.message);
    isPostgresConnected = false;
    return false;
  } finally {
    if (client) client.release();
  }
}

export function isPgActive(): boolean {
  return isPostgresConnected;
}

export async function queryPg<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPostgresPool();
  if (!pool || !isPostgresConnected) {
    throw new Error('Supabase/PostgreSQL is not active');
  }
  const result = await pool.query(text, params);
  return result.rows as T[];
}
