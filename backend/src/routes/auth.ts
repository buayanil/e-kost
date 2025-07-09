import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { SignJWT } from 'jose';
import dotenv from 'dotenv';
import {authMiddleware} from "../middleware/auth.middleware";

dotenv.config();

const prisma = new PrismaClient();
const router = Router();

router.post('/register', async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;

        // Basic validation
        if (!username || !password) {
            res.status(400).json({ error: 'Username and password are required.' });
            return;
        }

        // Check if username already exists
        const existingManager = await prisma.manager.findUnique({
            where: { username },
        });

        if (existingManager) {
            res.status(409).json({ error: 'Username already taken.' });
            return;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create new manager
        await prisma.manager.create({
            data: {
                username,
                passwordHash,
            },
        });

        res.status(201).json({ message: 'Manager created successfully.' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});



router.post('/login', async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required.' });
        return;
    }

    try {
        const manager = await prisma.manager.findUnique({ where: { username } });

        if (!manager) {
            res.status(401).json({ error: 'Invalid credentials.' });
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, manager.passwordHash);

        if (!isPasswordValid) {
            res.status(401).json({ error: 'Invalid credentials.' });
            return;
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const token = await new SignJWT({ sub: manager.id.toString() })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('7d')
            .sign(secret);

        res.status(200).json({ token });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Server error.' });
    }
});

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
    const managerId = Number((req as any).userId);
    const manager = await prisma.manager.findUnique({ where: { id: managerId } });
    res.status(200).json({ username: manager?.username });
});


export default router;
