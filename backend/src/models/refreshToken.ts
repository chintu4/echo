import { query } from '../controllers/database';

export interface RefreshTokenRow {
    id: number;
    user_id: number;
    token_hash: string;
    expires_at: string;
    revoked: number;
    created_at: string;
}

class RefreshTokenModel {
    static async initTable() {
        const sql = `
            CREATE TABLE IF NOT EXISTS refresh_tokens (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                token_hash VARCHAR(255) NOT NULL,
                expires_at DATETIME NOT NULL,
                revoked TINYINT DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        await query(sql);
    }

    static async create(userId: number, tokenHash: string, expiresAt: string) {
        const sql = 'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)';
        const res = await query(sql, [userId, tokenHash, expiresAt]);
        return res;
    }

    static async findByHash(tokenHash: string): Promise<RefreshTokenRow | null> {
        const sql = 'SELECT * FROM refresh_tokens WHERE token_hash = ? LIMIT 1';
        const rows = await query(sql, [tokenHash]) as RefreshTokenRow[];
        if (rows && rows.length) return rows[0];
        return null;
    }

    static async revokeById(id: number) {
        const sql = 'UPDATE refresh_tokens SET revoked = 1 WHERE id = ?';
        await query(sql, [id]);
    }

    static async revokeByHash(hash: string) {
        const sql = 'UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?';
        await query(sql, [hash]);
    }
}

export default RefreshTokenModel;
