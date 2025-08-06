import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import app from '../app';
import { PrismaClient } from '@prisma/client';
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

describe('Auth Routes', () => {
    const testUser = {
        username: 'testuser',
        password: 'testpass123',
    };

    beforeEach(async () => {
        // Clean the test manager before each run
        await prisma.manager.deleteMany({
            where: { username: testUser.username },
        });
    });

    it('registers a new manager', async () => {
        const res = await request(app)
            .post('/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Manager created successfully.');
    });

    it('fails to register duplicate manager', async () => {
        await prisma.manager.create({
            data: {
                username: testUser.username,
                passwordHash: await bcrypt.hash(testUser.password, 10),
            },
        });

        const res = await request(app)
            .post('/auth/register')
            .send(testUser);

        expect(res.status).toBe(409);
    });

    it('logs in and returns a JWT token', async () => {
        // Register first
        await request(app).post('/auth/register').send(testUser);

        const res = await request(app)
            .post('/auth/login')
            .send(testUser);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('token');
    });

    it('fails login with wrong password', async () => {
        await request(app).post('/auth/register').send(testUser);

        const res = await request(app)
            .post('/auth/login')
            .send({
                username: testUser.username,
                password: 'wrongpassword',
            });

        expect(res.status).toBe(401);
    });

    it('accesses /me with valid token', async () => {
        await request(app).post('/auth/register').send(testUser);

        const loginRes = await request(app)
            .post('/auth/login')
            .send(testUser);

        const token = loginRes.body.token;

        const meRes = await request(app)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`);

        expect(meRes.status).toBe(200);
        expect(meRes.body).toHaveProperty('username', testUser.username);
    });

    it('blocks access to /me without token', async () => {
        const res = await request(app).get('/auth/me');
        expect(res.status).toBe(401);
    });
});
