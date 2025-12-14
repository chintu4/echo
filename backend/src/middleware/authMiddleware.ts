import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface IRequest extends Request {
    user?: any;
}

const authenticate = (req: IRequest, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    try {
        const SECRET_KEY = process.env.SECRET_KEY || "default_secret_key";
        const decoded = jwt.verify(token, SECRET_KEY);
        req.user = decoded;
        next();
    } catch (ex) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

export default authenticate;
