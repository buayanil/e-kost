import request from "supertest";
import express from "express";
import { describe, it, beforeEach, expect } from "vitest";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

import meRouter from "../routes/me";
import { prisma } from "../prismaClient";

dotenv.config({ path: ".env.test" });

const app = express();
app.use(express.json());
app.use("/me", meRouter);

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const createJWT = async (id: number) =>
    await new SignJWT({ id })
        .setProtectedHeader({ alg: "HS256" })
        .sign(JWT_SECRET);

describe("Integration test: /me (real router)", () => {
    let token: string;
    let managerId: number;

    beforeEach(async () => {
        await prisma.roomAssignment.deleteMany();
        await prisma.tenantTransaction.deleteMany();
        await prisma.managerTransaction.deleteMany();
        await prisma.tenant.deleteMany();
        await prisma.room.deleteMany();
        await prisma.manager.deleteMany();

        const passwordHash = await bcrypt.hash("password123", 10);
        const manager = await prisma.manager.create({
            data: { username: "admin", passwordHash },
        });

        managerId = manager.id;
        token = await createJWT(managerId);
    });

    it("GET /me should return manager profile", async () => {
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

    it("PUT /me should update username and password", async () => {
        const res = await request(app)
            .put("/me")
            .set("Authorization", `Bearer ${token}`)
            .send({ username: "newuser", password: "newpass" });

        expect(res.status).toBe(200);
        expect(res.body.username).toBe("newuser");

        const updated = await prisma.manager.findUnique({ where: { id: managerId } });
        expect(updated?.username).toBe("newuser");
        expect(await bcrypt.compare("newpass", updated!.passwordHash)).toBe(true);
    });

    it("GET /me without token returns 401", async () => {
        const res = await request(app).get("/me");
        expect(res.status).toBe(401);
    });

    it("PUT /me with no update fields returns 400", async () => {
        const res = await request(app)
            .put("/me")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        expect(res.status).toBe(400);
    });
});
