import request from "supertest";
import express from "express";
import { describe, it, beforeEach, expect } from "vitest";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

import assignmentRouter from "../routes/roomAssignment";
import { prisma } from "../prismaClient";

dotenv.config({ path: ".env.test" });

const app = express();
app.use(express.json());
app.use("/assignments", assignmentRouter);

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const createJWT = async (id: number) =>
    await new SignJWT({ id }).setProtectedHeader({ alg: "HS256" }).sign(JWT_SECRET);

describe("Integration test: /assignments (real router + auth)", () => {
    let token: string;
    let managerId: number;
    let tenantId: number;
    let roomId: number;
    let assignmentId: number;

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

        const tenant = await prisma.tenant.create({ data: { name: "Tenant A" } });
        const room = await prisma.room.create({ data: { name: "Room A" } });

        tenantId = tenant.id;
        roomId = room.id;

        const assignment = await prisma.roomAssignment.create({
            data: {
                tenantId,
                roomId,
                startDate: new Date("2025-01-01"),
            },
        });

        assignmentId = assignment.id;
    });

    it("GET /assignments should return all assignments", async () => {
        const res = await request(app)
            .get("/assignments")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body[0]).toMatchObject({
            id: assignmentId,
            tenant: expect.objectContaining({ id: tenantId }),
            room: expect.objectContaining({ id: roomId }),
        });
    });

    it("POST /assignments should create a new assignment", async () => {
        const res = await request(app)
            .post("/assignments")
            .set("Authorization", `Bearer ${token}`)
            .send({
                tenantId,
                roomId,
                startDate: "2025-02-01",
            });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({
            tenant: expect.objectContaining({ id: tenantId }),
            room: expect.objectContaining({ id: roomId }),
            startDate: expect.any(String),
        });
    });

    it("POST /assignments with missing fields should return 400", async () => {
        const res = await request(app)
            .post("/assignments")
            .set("Authorization", `Bearer ${token}`)
            .send({ tenantId });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Missing tenantId, roomId or startDate");
    });

    it("PUT /assignments/:id should update assignment's endDate", async () => {
        const res = await request(app)
            .put(`/assignments/${assignmentId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ endDate: "2025-03-01" });

        expect(res.status).toBe(200);
        expect(new Date(res.body.endDate).toISOString()).toBe("2025-03-01T00:00:00.000Z");
    });

    it("PUT /assignments/:id with non-existent ID should return 404", async () => {
        const res = await request(app)
            .put("/assignments/9999")
            .set("Authorization", `Bearer ${token}`)
            .send({ endDate: "2025-03-01" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Assignment not found");
    });

    it("DELETE /assignments/:id should delete the assignment", async () => {
        const res = await request(app)
            .delete(`/assignments/${assignmentId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(204);

        const deleted = await prisma.roomAssignment.findUnique({ where: { id: assignmentId } });
        expect(deleted).toBeNull();
    });

    it("DELETE /assignments/:id with non-existent ID should return 404", async () => {
        const res = await request(app)
            .delete("/assignments/9999")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Assignment not found");
    });

    it("GET /assignments without token should return 401", async () => {
        const res = await request(app).get("/assignments");
        expect(res.status).toBe(401);
    });
});
