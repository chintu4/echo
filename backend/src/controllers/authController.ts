// controllers/authController.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/user';
import RefreshTokenModel from '../models/refreshToken';
import type { RowDataPacket } from 'mysql2';

const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";
const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_DAYS = 30;

const generateAccessToken = (user: any) => {
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, {
        expiresIn: ACCESS_TOKEN_EXPIRES
    });
    return token;
};

const generateRefreshTokenString = () => {
    return crypto.randomBytes(64).toString('hex');
};

const setRefreshCookie = (res: any, token: string) => {
    const maxAge = REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000; // ms
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge,
        path: '/'
    });
};

const hashToken = (token: string) => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

const login = async (req: any, res: any) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password || !(await User.isValidPassword(password, user.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    const accessToken = generateAccessToken(user);

    // create refresh token
    const refreshString = generateRefreshTokenString();
    const hash = hashToken(refreshString);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
    await RefreshTokenModel.create(user.id, hash, expiresAt);

    setRefreshCookie(res, refreshString);

    res.json({ accessToken });
};

const signup = async (req: any, res: any) => {
    const { email, password } = req.body;
    try {
        if (await User.findOne({ email })) {
            return res.status(400).json({ message: 'User already exists' });
        }
        await User.create({ email, password });
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
};

const refresh = async (req: any, res: any) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) return res.status(401).json({ message: 'No refresh token' });
        const hash = hashToken(token);
        const row = await RefreshTokenModel.findByHash(hash);
        if (!row) return res.status(401).json({ message: 'Invalid refresh token' });
        if (row.revoked) return res.status(401).json({ message: 'Refresh token revoked' });
        if (new Date(row.expires_at) < new Date()) return res.status(401).json({ message: 'Refresh token expired' });

        // rotate: revoke old and create new
        await RefreshTokenModel.revokeById(row.id);
        const newRefresh = generateRefreshTokenString();
        const newHash = hashToken(newRefresh);
        const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');
        await RefreshTokenModel.create(row.user_id, newHash, expiresAt);
        setRefreshCookie(res, newRefresh);

        // issue new access token
        const user = await User.findById(row.user_id);
        const accessToken = generateAccessToken(user);
        res.json({ accessToken });
    } catch (err) {
        res.status(500).json({ message: 'Error refreshing token' });
    }
};

const logout = async (req: any, res: any) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            const hash = hashToken(token);
            await RefreshTokenModel.revokeByHash(hash);
        }
        res.clearCookie('refreshToken', { path: '/' });
        res.json({ message: 'Logged out' });
    } catch (err) {
        res.status(500).json({ message: 'Error logging out' });
    }
};

export { login, signup, refresh, logout };

