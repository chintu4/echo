import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('initializeDatabasePool', () => {
    let originalRetries: string | undefined;

    beforeEach(() => {
        originalRetries = process.env.DB_INIT_RETRIES;
    });

    afterEach(() => {
        process.env.DB_INIT_RETRIES = originalRetries;
        vi.restoreAllMocks();
    });

    it('retries and succeeds when createConnection eventually works', async () => {
        process.env.DB_INIT_RETRIES = '3';

        let attempts = 0;
        const fakeConnection = {
            query: vi.fn().mockResolvedValue([[], []]),
            end: vi.fn().mockResolvedValue(undefined),
        };

        vi.mocked(await import('mysql2/promise'));

        // mock module
        vi.doMock('mysql2/promise', () => ({
            createConnection: async () => {
                attempts++;
                if (attempts < 3) throw new Error('ECONNREFUSED');
                return fakeConnection;
            },
            createPool: () => ({ execute: vi.fn() }),
        }));

        const db = await import('../src/controllers/database');
        const pool = await db.initializeDatabasePool();
        expect(pool).toBeTruthy();
    });

    it('returns undefined after exceeding retries', async () => {
        process.env.DB_INIT_RETRIES = '2';

        vi.doMock('mysql2/promise', () => ({
            createConnection: async () => {
                throw new Error('ECONNREFUSED');
            },
            createPool: () => ({ execute: vi.fn() }),
        }));

        const db = await import('../src/controllers/database');
        const pool = await db.initializeDatabasePool();
        expect(pool).toBeUndefined();
    });
});
