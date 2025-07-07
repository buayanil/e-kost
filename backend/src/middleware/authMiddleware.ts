import { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import dotenv from 'dotenv';

dotenv.config();

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing or invalid authorization header.' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const { payload } = await jwtVerify(token, secret);
        (req as any).userId = payload.sub;
        next();
    } catch (err) {
        console.error('Invalid token:', err);
        res.status(401).json({ error: 'Invalid or expired token.' });
    }
}
