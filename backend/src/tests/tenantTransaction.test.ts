import request from "supertest";
import express from "express";
import { describe, it, beforeEach, expect } from "vitest";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

import transactionRouter from "../routes/tenantTransaction";
import { prisma } from "../prismaClient";

dotenv.config({ path: ".env.test" });

const app = express();
app.use(express.json());
app.use("/transactions", transactionRouter);

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const createJWT = async (id: number) =>
    await new SignJWT({ id }).setProtectedHeader({ alg: "HS256" }).sign(JWT_SECRET);

describe("Integration test: /transactions (real router + token verification)", () => {
    let token: string;
    let managerId: number;
    let tenantId: number;
    let roomId: number;
    let transactionId: number;

    beforeEach(async () => {
        await prisma.tenantTransaction.deleteMany();
        await prisma.roomAssignment.deleteMany();
        await prisma.tenant.deleteMany();
        await prisma.room.deleteMany();
        await prisma.manager.deleteMany();

        const passwordHash = await bcrypt.hash("password123", 10);
        const manager = await prisma.manager.create({
            data: { username: "admin", passwordHash },
        });
        managerId = manager.id;
        token = await createJWT(managerId);

        const tenant = await prisma.tenant.create({ data: { name: "Tenant A" } });
        const room = await prisma.room.create({ data: { name: "Room A" } });

        tenantId = tenant.id;
        roomId = room.id;

        const tx = await prisma.tenantTransaction.create({
            data: {
                tenantId,
                roomId,
                managerId,
                amount: 500,
                startMonth: new Date("2025-01-01"),
                endMonth: new Date("2025-01-31"),
                paymentDate: new Date(),
                notes: "Initial payment",
            },
        });

        transactionId = tx.id;
    });

    it("GET /transactions should return all transactions", async () => {
        const res = await request(app)
            .get("/transactions")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body[0]).toMatchObject({
            id: transactionId,
            amount: "500",
            tenant: expect.objectContaining({ id: tenantId }),
            room: expect.objectContaining({ id: roomId }),
            manager: expect.objectContaining({ id: managerId }),
        });
    });

    it("GET /transactions/:id should return one transaction", async () => {
        const res = await request(app)
            .get(`/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.id).toBe(transactionId);
    });

    it("GET /transactions/:id with non-existing ID should return 404", async () => {
        const res = await request(app)
            .get("/transactions/9999")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Transaction not found");
    });

    it("POST /transactions should create a transaction", async () => {
        const res = await request(app)
            .post("/transactions")
            .set("Authorization", `Bearer ${token}`)
            .send({
                tenantId,
                roomId,
                amount: 300,
                startMonth: "2025-02-01",
                endMonth: "2025-02-28",
                notes: "February rent",
            });

        expect(res.status).toBe(201);
        expect(res.body.amount).toBe("300");
        expect(res.body.managerId).toBe(managerId);
    });

    it("POST /transactions without token should return 401", async () => {
        const res = await request(app)
            .post("/transactions")
            .send({
                tenantId,
                roomId,
                amount: 300,
                startMonth: "2025-02-01",
                endMonth: "2025-02-28",
            });

        expect(res.status).toBe(401);
    });

    it("POST /transactions with missing fields should return 400", async () => {
        const res = await request(app)
            .post("/transactions")
            .set("Authorization", `Bearer ${token}`)
            .send({ tenantId, amount: 300 });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Missing required fields");
    });

    it("PUT /transactions/:id should update notes and amount", async () => {
        const res = await request(app)
            .put(`/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                notes: "Updated note",
                amount: 550,
            });

        expect(res.status).toBe(200);
        expect(res.body.notes).toBe("Updated note");
        expect(res.body.amount).toBe("550");
    });

    it("PUT /transactions/:id with invalid ID should return 404", async () => {
        const res = await request(app)
            .put("/transactions/9999")
            .set("Authorization", `Bearer ${token}`)
            .send({ notes: "Invalid" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Transaction not found");
    });

    it("DELETE /transactions/:id should delete the transaction", async () => {
        const res = await request(app)
            .delete(`/transactions/${transactionId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(204);

        const exists = await prisma.tenantTransaction.findUnique({ where: { id: transactionId } });
        expect(exists).toBeNull();
    });

    it("DELETE /transactions/:id with invalid ID should return 404", async () => {
        const res = await request(app)
            .delete("/transactions/9999")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Transaction not found");
    });

    it("GET /transactions without token should return 401", async () => {
        const res = await request(app).get("/transactions");
        expect(res.status).toBe(401);
    });
});
