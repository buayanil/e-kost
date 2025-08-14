import request from "supertest";
import express, { Request, Response, NextFunction } from "express";
import { describe, it, beforeEach, expect } from "vitest";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { SignJWT, jwtVerify } from "jose";

import { prisma } from "../prismaClient";
import { getMe, updateMe } from "../controllers/me.controller"; // adjust path if needed

dotenv.config({ path: ".env.test" });

/**
 * Minimal auth middleware for tests:
 * - Reads Bearer token
 * - Verifies with HS256
 * - Puts { id } onto req.user so getManagerIdFromReq can find it
 */
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const testAuth =
    () => async (req: Request, _res: Response, next: NextFunction) => {
        try {
            const auth = req.header("authorization") || req.header("Authorization");
            if (!auth?.startsWith("Bearer ")) return next(); // handlers will 401
            const token = auth.slice("Bearer ".length);
            const { payload } = await jwtVerify(token, JWT_SECRET, {
                algorithms: ["HS256"],
            });
            // Attach the ID in one of the places your helper checks:
            (req as any).user = { id: payload.id };
            next();
        } catch {
            // Malformed/invalid token --> just proceed; handler will 401
            next();
        }
    };

const createJWT = async (id: number) =>
    await new SignJWT({ id })
        .setProtectedHeader({ alg: "HS256" })
        .sign(JWT_SECRET);

// Build a tiny app exposing only /me endpoints
const app = express();
app.use(express.json());
app.use(testAuth());
app.get("/me", getMe);
app.put("/me", updateMe);

describe("Integration test: /me (profile endpoints)", () => {
    let managerId: number;
    let token: string;

    beforeEach(async () => {
        // Clean DB (respect FK order)
        await prisma.roomAssignment.deleteMany();
        await prisma.tenantTransaction.deleteMany();
        await prisma.managerTransaction.deleteMany();
        await prisma.tenant.deleteMany();
        await prisma.room.deleteMany();
        await prisma.manager.deleteMany();

        // Seed one manager
        const passwordHash = await bcrypt.hash("password123", 10);
        const manager = await prisma.manager.create({
            data: { username: "admin", passwordHash },
        });
        managerId = manager.id;
        token = await createJWT(managerId);
    });

    it("GET /me without token -> 401", async () => {
        const res = await request(app).get("/me");
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ message: "Unauthorized" });
    });

    it("GET /me with valid token -> 200 + basic profile", async () => {
        const res = await request(app)
            .get("/me")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            id: managerId,
            username: "admin",
            createdAt: expect.any(String),
        });
    });

    it("GET /me with token for deleted account -> 401 Account not found", async () => {
        // Delete the manager after token issuance
        await prisma.manager.delete({ where: { id: managerId } });

        const res = await request(app)
            .get("/me")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ message: "Account not found" });
    });

    it("PUT /me without token -> 401", async () => {
        const res = await request(app).put("/me").send({ username: "newname" });
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ message: "Unauthorized" });
    });

    it("PUT /me with empty body -> 400 Nothing to update", async () => {
        const res = await request(app)
            .put("/me")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body).toMatchObject({ message: "Nothing to update" });
    });

    it("PUT /me update username only -> 200 and username changed", async () => {
        const res = await request(app)
            .put("/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ username: "admin2" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            id: managerId,
            username: "admin2",
            createdAt: expect.any(String),
        });

        const inDb = await prisma.manager.findUnique({ where: { id: managerId } });
        expect(inDb?.username).toBe("admin2");
    });

    it("PUT /me update password only -> 200 and passwordHash actually changes", async () => {
        const before = await prisma.manager.findUnique({ where: { id: managerId } });
        expect(before).not.toBeNull();

        const res = await request(app)
            .put("/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ password: "newSecret#1" });

        expect(res.status).toBe(200);
        // Response doesn't include hash by design
        expect(res.body).toEqual({
            id: managerId,
            username: "admin", // unchanged
            createdAt: expect.any(String),
        });

        const after = await prisma.manager.findUnique({ where: { id: managerId } });
        expect(after).not.toBeNull();
        expect(after!.passwordHash).not.toBe(before!.passwordHash);
        const matches = await bcrypt.compare("newSecret#1", after!.passwordHash);
        expect(matches).toBe(true);
    });

    it("PUT /me update both username and password -> both applied", async () => {
        const res = await request(app)
            .put("/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ username: "combo", password: "comboPass123" });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            id: managerId,
            username: "combo",
            createdAt: expect.any(String),
        });

        const inDb = await prisma.manager.findUnique({ where: { id: managerId } });
        expect(inDb?.username).toBe("combo");
        const ok = await bcrypt.compare("comboPass123", inDb!.passwordHash);
        expect(ok).toBe(true);
    });
});
