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
    res.send('{"status":"success"}');
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
app.delete("/post/:id", authenticate, deletePost);
app.delete("/post", authenticate, deletePost);

const PORT = process.env.PORT || "5000";

// Only start the server when not running tests
if (process.env.NODE_ENV !== 'test') {
    app.listen(parseInt(PORT), () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

export default app;
