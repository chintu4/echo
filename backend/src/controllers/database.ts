// database.ts

import { createPool, type Pool, type PoolOptions } from 'mysql2/promise';


// service :MySql@localhost:3306
const config: PoolOptions = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'test',
    waitForConnections: true, // If connection limit is reached, wait for a connection to be released
    connectionLimit: 10,       // Max number of connections in the pool
    queueLimit: 0              // No limit for the connection queue
};

let pool: Pool;

/**
 * Initializes the MySQL Connection Pool.
 * @returns The initialized Pool instance.
 */
export async function initializeDatabasePool() {
    if (!pool) {
        console.log('Initializing database connection pool...');
        try {
            // Check if database exists, if not create it
            const connection = await require('mysql2/promise').createConnection({
                host: config.host,
                user: config.user,
                password: config.password,
            });
            await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
            await connection.end();

            pool = createPool(config);
            console.log('Database pool successfully created.');
        } catch (error) {
            console.error('Failed to initialize database pool:', error);
            // In a real application, you might want to exit the process here
            process.exit(1);
        }
    }
    return pool;
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