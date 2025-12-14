// routes/protectedRoute.ts
import express, { type Request, type Response } from 'express';
import authenticate from '../middleware/authMiddleware';

const router = express.Router();

router.get('/protected', authenticate, (req: Request, res: Response) => {
    res.json({ message: 'Hello, authenticated user!' });
});

export default router;
