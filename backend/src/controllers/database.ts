// database.ts

import { createPool, createConnection, type Pool, type PoolOptions } from 'mysql2/promise';


// service :MySql@localhost:3306
const config: PoolOptions = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'PASSWORD',
    database: process.env.DB_NAME || 'test',
    port: (() => {
        const p = Number(process.env.DB_PORT);
        return Number.isInteger(p) && p > 0 ? p : 3306;
    })(),
    waitForConnections: true, // If connection limit is reached, wait for a connection to be released
    connectionLimit: 10,       // Max number of connections in the pool
    queueLimit: 0              // No limit for the connection queue
};

let pool: Pool;

/**
 * Initializes the MySQL Connection Pool.
 * @returns The initialized Pool instance.
 */
export async function initializeDatabasePool(): Promise<Pool | undefined> {
    if (pool) return pool;

    console.log('Initializing database connection pool...');

    const maxAttempts = Number(process.env.DB_INIT_RETRIES) || 5;
    const initialDelayMs = 500;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            // Check if database exists, if not create it
            const connection = await createConnection({
                host: config.host,
                user: config.user,
                password: config.password,
            });
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
            await connection.end();

            pool = createPool(config);
            console.log('Database pool successfully created.');
            return pool;
        } catch (error) {
            console.error(`Attempt ${attempt} - Failed to initialize database pool:`, error);
            if (attempt < maxAttempts) {
                const delay = Math.min(30000, initialDelayMs * 2 ** (attempt - 1));
                console.log(`Retrying database init in ${delay}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }
            console.error('Exceeded max DB init attempts. Continuing without DB pool.');
            // Don't exit here: allow the server to start in a degraded mode so healthchecks or infra
            // tooling can see the process and we can handle DB errors at request-time.
            return undefined;
        }
    }

    return undefined;
}

/**
 * Returns the existing database pool instance.
 * Throws an error if the pool has not been initialized.
 * @returns The existing Pool instance.
 */
export function getDatabasePool(): Pool {
    if (!pool) {
        throw new Error('Database pool has not been initialized. Call initializeDatabasePool() first.');
    }
    return pool;
}

/**
 * Example function to execute a query.
 * @param sql The SQL query string.
 * @param values Values to escape into the query (prevents SQL injection).
 * @returns The result of the query.
 */
export async function query(sql: string, values?: any[]): Promise<any> {
    const db = getDatabasePool();
    // execute returns [rows, fields], we typically only care about the rows
    const [rows] = await db.execute(sql, values);
    return rows;
}