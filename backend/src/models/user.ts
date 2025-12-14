import { query } from '../controllers/database';
import bcrypt from 'bcryptjs';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

function isTestEnv(): boolean {
    if (process.env.NODE_ENV === 'test') return true;
    if (process.env.VITEST === 'true' || process.env.VITEST === '1') return true;
    if (typeof process.env.VITEST_WORKER_ID !== 'undefined') return true;
    if (process.argv.some((a) => a.toLowerCase().includes('vitest'))) return true;
    return false;
}

const BCRYPT_ROUNDS = (() => {
    const fromEnv = Number(process.env.BCRYPT_ROUNDS);
    if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
    return isTestEnv() ? 4 : 10;
})();

export interface UserData extends RowDataPacket {
    id: number;
    email: string;
    password?: string;
}

class UserModel {
    static async initTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                bio TEXT,
                location VARCHAR(255),
                website VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await query(sql);

        // Ensure columns exist for older databases (best-effort migration).
        // Some MySQL versions do not support `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
        // Query INFORMATION_SCHEMA and only add missing columns to avoid syntax errors.
        try {
            const cols = [
                { name: 'name', sql: 'VARCHAR(255)' },
                { name: 'handle', sql: 'VARCHAR(255)' },
                { name: 'bio', sql: 'TEXT' },
                { name: 'location', sql: 'VARCHAR(255)' },
                { name: 'website', sql: 'VARCHAR(255)' },
                { name: 'created_at', sql: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' }
            ];
            // Ensure unique index on handle
            try {
                const idxRows = await query('SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.STATISTICS WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?', ['users', 'users_handle_unique']);
                const cnt = idxRows && idxRows[0] && (idxRows[0].cnt ?? Object.values(idxRows[0])[0]) || 0;
                if (Number(cnt) === 0) {
                    try {
                        await query('CREATE UNIQUE INDEX users_handle_unique ON users(handle)');
                    } catch (err) {
                        // ignore index creation errors (e.g., existing duplicates on old data)
                    }
                }
            } catch (err) {
                // ignore
            }

            for (const col of cols) {
                const rows = await query(
                    'SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
                    ['users', col.name]
                ) as any;
                const cnt = rows && rows[0] && (rows[0].cnt ?? Object.values(rows[0])[0]) || 0;
                if (Number(cnt) === 0) {
                    await query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.sql}`);
                }
            }
        } catch (err) {
            // Non-fatal; log so maintainers can inspect migration issues.
            console.warn('Migration warning (non-fatal):', err);
        }

        // Generate handles for existing users without handles
        // await this.generateHandlesForUsersWithoutHandle();
    }

    static async findOne(criteria: { email: string }): Promise<UserData | null> {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const rows = await query(sql, [criteria.email]) as UserData[];
        if (!rows || rows.length === 0) return null;
        return rows[0] || null;
    }

    static async create(user: { email: string, password?: string, name?: string, handle?: string }) {
        if (!user.password) throw new Error("Password required");
        const hashedPassword = await bcrypt.hash(user.password, BCRYPT_ROUNDS);
        const sql = 'INSERT INTO users (email, password, name, handle) VALUES (?, ?, ?, ?)';
        const result = (await query(
            sql,
            [user.email, hashedPassword, user.name || null, user.handle || null]
        ) as unknown) as ResultSetHeader;
        return { ...user, id: result.insertId, password: hashedPassword };
    }

    static async isValidPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    static async findById(id: number): Promise<UserData | null> {
        const sql = 'SELECT id, email, name, handle, bio, location, website, created_at FROM users WHERE id = ?';
        const rows = await query(sql, [id]) as UserData[];
        if (!rows || rows.length === 0) return null;
        return rows[0] || null;
    }

    static async update(id: number, data: { email?: string, password?: string, name?: string, handle?: string, bio?: string, location?: string, website?: string }) {
        let sql = 'UPDATE users SET ';
        const values: any[] = [];
        const updates: string[] = [];

        if (data.email) {
            updates.push('email = ?');
            values.push(data.email);
        }
        if (data.password) {
            const hashedPassword = await bcrypt.hash(data.password, 10);
            updates.push('password = ?');
            values.push(hashedPassword);
        }
        if (data.name !== undefined) {
            updates.push('name = ?');
            values.push(data.name);
        }
        if (data.handle !== undefined) {
            updates.push('handle = ?');
            values.push(data.handle);
        }
        if (data.bio !== undefined) {
            updates.push('bio = ?');
            values.push(data.bio);
        }
        if (data.location !== undefined) {
            updates.push('location = ?');
            values.push(data.location);
        }
        if (data.website !== undefined) {
            updates.push('website = ?');
            values.push(data.website);
        }

        if (updates.length === 0) return;

        sql += updates.join(', ') + ' WHERE id = ?';
        values.push(id);

        // Log SQL & params for debugging (helpful when a field like `handle`
        // doesn't appear to persist in the database during manual testing).
        console.debug('Executing user update:', sql, values);

        await query(sql, values);
    }

    static async delete(id: number) {
        const sql = 'DELETE FROM users WHERE id = ?';
        await query(sql, [id]);
    }

    static async generateHandlesForUsersWithoutHandle() {
        try {
            // Check if handle column exists before querying
            const colCheck = await query(
                'SELECT COUNT(*) as cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?',
                ['users', 'handle']
            ) as any;
            const colExists = colCheck && colCheck[0] && (Number(colCheck[0].cnt) > 0 || Number(Object.values(colCheck[0])[0]) > 0);
            
            if (!colExists) {
                console.log('⚠ Handle column does not exist yet. Skipping handle generation.');
                return { updated: 0, errors: 0 };
            }

            // Find all users without a handle
            const usersWithoutHandle = await query(
                "SELECT id, email, name FROM users WHERE handle IS NULL OR handle = ''",
                []
            ) as any[];

            if (!usersWithoutHandle || usersWithoutHandle.length === 0) {
                console.log('✓ No users found without handles.');
                return { updated: 0, errors: 0 };
            }

            console.log(`Found ${usersWithoutHandle.length} user(s) without handles. Generating...`);
            let updated = 0;
            let errors = 0;

            for (const user of usersWithoutHandle) {
                try {
                    // Generate handle from name or email
                    const baseSource = (user.name || user.email || '').toString();
                    let base = baseSource && baseSource.length > 0 ? baseSource : (user.email || '').split('@')[0] || 'user';
                    base = base.toLowerCase().replace(/[^a-z0-9_]/g, '').replace(/^_+|_+$/g, '');
                    if (!base) base = 'user';
                    base = base.slice(0, 24);

                    let candidate = base;
                    let suffix = 0;

                    // Find a unique handle
                    while (suffix < 10000) {
                        const rows: any = await query('SELECT id FROM users WHERE handle = ? LIMIT 1', [candidate]);
                        if (!rows || !rows[0]) break;
                        suffix += 1;
                        candidate = (base + suffix.toString()).slice(0, 30);
                    }

                    // Update user with generated handle
                    await query('UPDATE users SET handle = ? WHERE id = ?', [candidate, user.id]);
                    updated++;
                    console.log(`  ✓ Generated handle '${candidate}' for user ${user.id} (${user.email})`);
                } catch (err) {
                    errors++;
                    console.error(`  ✗ Error generating handle for user ${user.id}:`, err);
                }
            }

            console.log(`✓ Handle generation complete: ${updated} updated, ${errors} errors`);
            return { updated, errors };
        } catch (err) {
            console.error('✗ Error in generateHandlesForUsersWithoutHandle:', err);
            return { updated: 0, errors: -1 };
        }
    }
}

export default UserModel;