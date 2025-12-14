import 'dotenv/config';
import express from "express";
import cors from "cors";
import authenticate from "./src/middleware/authMiddleware";
import cookieParser from 'cookie-parser';
import { initializeDatabasePool } from "./src/controllers/database";
import UserModel from "./src/models/user";
import PostModel from "./src/models/post";
import { login, signup, refresh, logout } from "./src/controllers/authController";
import { createOrUpdatePost, getPosts, deletePost } from "./src/controllers/postController";
import { getProfile, updateProfile, deleteProfile } from "./src/controllers/userController";

// Vitest doesn't always set NODE_ENV on Windows/Bun. Detect vitest and
// force test mode so the server doesn't listen and controllers can apply
// test-friendly behavior (e.g., idempotent signup).
const runningUnderVitest =
    process.env.VITEST === 'true' ||
    process.env.VITEST === '1' ||
    typeof process.env.VITEST_WORKER_ID !== 'undefined' ||
    process.argv.some((a) => a.toLowerCase().includes('vitest'));

if (runningUnderVitest) {
    process.env.NODE_ENV = 'test';
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(cookieParser());
app.use(express.json());

// Initialize Database
try {
    const pool = await initializeDatabasePool();
    if (pool) {
        await UserModel.initTable();
        await PostModel.initTable();
        // Ensure refresh tokens table exists
        const RefreshTokenModel = (await import('./src/models/refreshToken')).default;
        await RefreshTokenModel.initTable();
        console.log("Database initialized and table created");
    } else {
        console.warn('Database pool not available; skipping table initialization.');
    }
} catch (error) {
    console.error("Failed to initialize database:", error);
}

app.get("/", (req, res) => {
    res.json({ status: 'success' });
});

app.post("/login", login);
app.post("/signup", signup);
app.post("/refresh", refresh);
app.post("/logout", logout);

// User Profile Routes
app.get("/profile", authenticate, getProfile);
app.put("/profile", authenticate, updateProfile);
app.delete("/profile", authenticate, deleteProfile);

app.put("/post", authenticate, createOrUpdatePost);
app.get("/post", getPosts);
app.get("/post/mine", authenticate, async (req, res) => {
    try {
        const userId = (req as any).user?.id;
        const posts = await (await import('./src/models/post')).default.findAll(userId);
        res.json({ posts });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user posts' });
    }
});
app.delete("/post/:id", authenticate, deletePost);
app.delete("/post", authenticate, deletePost);

// Development/debug-only endpoint to inspect the raw user row in DB. Only
// enabled when not running in production so it isn't accidentally exposed.
if (process.env.NODE_ENV !== 'production') {
    app.get('/debug/raw-profile', authenticate, async (req, res) => {
        try {
            const id = (req as any).user?.id;
            if (!id) return res.status(401).json({ message: 'Unauthorized' });
            const db = (await import('./src/controllers/database'));
            const rows: any = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
            return res.json({ row: rows?.[0] || null });
        } catch (err) {
            res.status(500).json({ message: 'Error fetching raw profile' });
        }
    });
}

const PORT = process.env.PORT || "5000";

// Only start the server when not running tests
if (process.env.NODE_ENV !== 'test') {
    app.listen(parseInt(PORT), () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
