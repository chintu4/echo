import { query } from '../controllers/database';
import bcrypt from 'bcryptjs';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

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

        // Ensure columns exist for older databases (best-effort migration)
        try {
            await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255)");
            await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT");
            await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS location VARCHAR(255)");
            await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS website VARCHAR(255)");
            await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
        } catch (err) {
            // Some MySQL versions may not support IF NOT EXISTS for ALTER; ignore errors
            console.warn('Migration warning (non-fatal):', err);
        }
    }

    static async findOne(criteria: { email: string }): Promise<UserData | null> {
        const sql = 'SELECT * FROM users WHERE email = ?';
        const rows = await query(sql, [criteria.email]) as UserData[];
        if (!rows || rows.length === 0) return null;
        return rows[0] || null;
    }

    static async create(user: { email: string, password?: string }) {
        if (!user.password) throw new Error("Password required");
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const sql = 'INSERT INTO users (email, password) VALUES (?, ?)';
        const result = await query(sql, [user.email, hashedPassword]) as ResultSetHeader;
        return { ...user, id: result.insertId, password: hashedPassword };
    }

    static async isValidPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
        return await bcrypt.compare(plainPassword, hashedPassword);
    }
    static async findById(id: number): Promise<UserData | null> {
        const sql = 'SELECT id, email, name, bio, location, website, created_at FROM users WHERE id = ?';
        const rows = await query(sql, [id]) as UserData[];
        if (!rows || rows.length === 0) return null;
        return rows[0] || null;
    }

    static async update(id: number, data: { email?: string, password?: string, name?: string, bio?: string, location?: string, website?: string }) {
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

        await query(sql, values);
    }

    static async delete(id: number) {
        const sql = 'DELETE FROM users WHERE id = ?';
        await query(sql, [id]);
    }
}

export default UserModel;