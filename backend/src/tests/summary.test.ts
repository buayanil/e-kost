import request from "supertest";
import express from "express";
import { describe, it, beforeEach, expect } from "vitest";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

import summaryRouter from "../routes/summary";
import { prisma } from "../prismaClient";

dotenv.config({ path: ".env.test" });

const app = express();
app.use(express.json());
app.use("/summary", summaryRouter);

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const createJWT = async (id: number) =>
    await new SignJWT({ id }).setProtectedHeader({ alg: "HS256" }).sign(JWT_SECRET);

describe("Integration test: /summary", () => {
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

        const room1 = await prisma.room.create({ data: { name: "Room A" } });
        const room2 = await prisma.room.create({ data: { name: "Room B" } });

        const tenant1 = await prisma.tenant.create({ data: { name: "Tenant A" } });
        const tenant2 = await prisma.tenant.create({ data: { name: "Tenant B" } });

        await prisma.roomAssignment.create({
            data: {
                tenantId: tenant1.id,
                roomId: room1.id,
                startDate: new Date(),
            },
        });

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        await prisma.tenantTransaction.create({
            data: {
                tenantId: tenant1.id,
                roomId: room1.id,
                managerId,
                amount: 500,
                startMonth: startOfMonth,
                endMonth: endOfMonth,
                paymentDate: now,
                notes: "Rent for August",
            },
        });

        await prisma.tenantTransaction.create({
            data: {
                tenantId: tenant2.id,
                roomId: room2.id,
                managerId,
                amount: 250,
                startMonth: startOfMonth,
                endMonth: endOfMonth,
                paymentDate: now,
                notes: "Partial payment",
            },
        });
    });

    it("GET /summary should return correct summary data", async () => {
        const res = await request(app)
            .get("/summary")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            totalRooms: 2,
            occupiedRooms: 1,
            totalTenants: 2,
            totalIncomeThisMonth: "750.00",
        });
    });

    it("GET /summary without token should return 401", async () => {
        const res = await request(app).get("/summary");
        expect(res.status).toBe(401);
    });
});
