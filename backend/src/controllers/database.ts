// database.ts

import {
  createPool,
  createConnection,
  type Pool,
  type PoolOptions,
  type PoolConnection,
} from 'mysql2/promise';
import type { MysqlError } from 'mysql2';

const {
  DB_HOST = 'localhost',
  DB_USER = 'app_user',
  DB_PASSWORD = 'PASSWORD',
  DB_NAME = 'test',
  DB_PORT,
  DB_INIT_RETRIES,
  DB_CONNECT_TIMEOUT_MS,
} = process.env;

const port = (() => {
  const p = Number(DB_PORT);
  return Number.isInteger(p) && p > 0 ? p : 3306;
})();

const connectTimeoutMs = Number(DB_CONNECT_TIMEOUT_MS ?? 5000);
const maxAttempts = Number(DB_INIT_RETRIES ?? 5);

const baseConnection = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  port,
  connectTimeout: connectTimeoutMs,
};

const poolConfig: PoolOptions = {
  ...baseConnection,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 100,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

let pool: Pool | undefined;

/* ---------- bootstrap ---------- */

export async function assertDatabase(): Promise<void> {
  const conn = await createConnection(baseConnection);
  await conn.ping();
  await conn.end();
}

/* ---------- init ---------- */

export async function initializeDatabasePool(): Promise<Pool> {
  if (pool) return pool;

  if (maxAttempts === 0) {
    throw new Error('DB_INIT_RETRIES=0. Database initialization disabled.');
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await assertDatabase();
      pool = createPool(poolConfig);

      pool.on('error', (err: MysqlError) => {
        console.error(
          `MySQL pool error code=${err.code} errno=${err.errno} message=${err.message}`,
        );
      });

      return pool;
    } catch (err) {
      lastError = err;
      const e = err as MysqlError;

      console.error(
        `DB init attempt ${attempt}/${maxAttempts} failed ` +
          `host=${DB_HOST} port=${port} code=${e?.code} message=${e?.message}`,
      );

      if (attempt < maxAttempts) {
        const delay = Math.min(30_000, 500 * 2 ** (attempt - 1));
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  throw lastError;
}

/* ---------- access ---------- */

export function getDatabasePool(): Pool {
  if (!pool) {
    throw new Error('Database pool not initialized');
  }
  return pool;
}

/* ---------- query helpers ---------- */

export async function query<T = any>(
  sql: string,
  values?: any[],
): Promise<T[]> {
  const db = getDatabasePool();
  const [rows] = await db.execute(sql, values);
  return rows as T[];
}

export async function withTransaction<T>(
  fn: (conn: PoolConnection) => Promise<T>,
): Promise<T> {
  const conn = await getDatabasePool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

/* ---------- shutdown ---------- */

export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
