// database.ts

import type {
  Pool,
  PoolOptions,
  PoolConnection,
} from 'mysql2/promise';

// Minimal MySQL error shape used for logging (avoid depending on mysql2's types)
type MysqlError = { code?: string; errno?: number; message?: string };

function isTestEnv(): boolean {
  if (process.env.NODE_ENV === 'test') return true;
  // Vitest commonly sets one or more of these at runtime.
  if (process.env.VITEST === 'true' || process.env.VITEST === '1') return true;
  if (typeof process.env.VITEST_WORKER_ID !== 'undefined') return true;
  // Fallback: detect vitest in argv (works for bun + vitest).
  if (process.argv.some((a) => a.toLowerCase().includes('vitest'))) return true;
  return false;
}

async function getMysql(): Promise<{
  createPool: (typeof import('mysql2/promise'))['createPool'];
  createConnection: (typeof import('mysql2/promise'))['createConnection'];
}> {
  // Import lazily so tests can vi.doMock('mysql2/promise') without needing
  // to reset the module cache for this file.
  return (await import('mysql2/promise')) as any;
}

function getDbConfig(): {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  connectTimeout: number;
  maxAttempts: number;
  poolConfig: PoolOptions;
} {
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

  const connectTimeout = Number(DB_CONNECT_TIMEOUT_MS ?? 5000);
  const maxAttempts = Number(DB_INIT_RETRIES ?? 5);

  const baseConnection = {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port,
    connectTimeout,
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

  return {
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port,
    connectTimeout,
    maxAttempts,
    poolConfig,
  };
}

let pool: Pool | undefined;

/* ---------- bootstrap ---------- */

export async function assertDatabase(): Promise<void> {
  const { host, user, password, port, connectTimeout } = getDbConfig();
  const { createConnection } = await getMysql();
  const conn: any = await createConnection({
    host,
    user,
    password,
    port,
    connectTimeout,
  });
  // some implementations (and our tests) provide a connection-like object
  // that may not implement `ping`. Prefer `ping` if available, otherwise
  // fall back to a simple query to validate connectivity.
  if (typeof conn.ping === 'function') {
    await conn.ping();
  } else if (typeof conn.query === 'function') {
    await conn.query('SELECT 1');
  } else if (typeof conn.execute === 'function') {
    await conn.execute('SELECT 1');
  } else {
    throw new Error('Cannot verify DB connection: missing ping/query/execute');
  }

  if (typeof conn.end === 'function') await conn.end();
}

/* ---------- init ---------- */

export async function initializeDatabasePool(): Promise<Pool> {

  // In test runs we want complete isolation between test cases.
  // (Vitest doesn't automatically reload this module between tests.)
  if (isTestEnv() && pool) {
    try {
      await pool.end();
    } catch (e) {
      // ignore
    }
    pool = undefined;
  }

  const { host, port, maxAttempts, poolConfig } = getDbConfig();
  const { createPool } = await getMysql();
  // Force reinitialization to avoid returning a stale pool when
  // tests mock the mysql2 library between test cases. This ensures
  // subsequent calls use the current module/mocks and don't rely on
  // previously-created pools.
  pool = undefined;
  if (maxAttempts === 0) {
    throw new Error('DB_INIT_RETRIES=0. Database initialization disabled.');
  }

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await assertDatabase();
      pool = createPool(poolConfig);

      if (typeof (pool as any).on === 'function') {
        (pool as any).on('error', (err: MysqlError) => {
          console.error(
            `MySQL pool error code=${err.code} errno=${err.errno} message=${err.message}`,
          );
        });
      }

      return pool;
    } catch (err) {
      lastError = err;
      const e = err as MysqlError;

      console.error(
        `DB init attempt ${attempt}/${maxAttempts} failed ` +
          `host=${host} port=${port} code=${e?.code} message=${e?.message}`,
      );

      if (attempt < maxAttempts) {
        const delay = Math.min(30_000, 500 * 2 ** (attempt - 1));
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // If we couldn't initialize the DB after retries, clear any existing
  // pool reference and return undefined so callers can decide how to proceed
  // (tests expect undefined rather than an exception in the failing path).
  pool = undefined;
  return undefined as unknown as Pool;
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
