import { initializeDatabasePool, query } from './src/controllers/database';

async function reset() {
    try {
        await initializeDatabasePool();
        console.log("Truncating users...");
        await query("TRUNCATE TABLE users");
        console.log("Truncating posts...");
        await query("TRUNCATE TABLE posts");
        console.log("Database reset complete.");
        process.exit(0);
    } catch (e: any) {
        console.error("Error resetting database:", e);
        process.exit(1);
    }
}

reset();
