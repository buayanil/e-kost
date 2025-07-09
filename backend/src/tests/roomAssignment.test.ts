import { describe, it, beforeAll, beforeEach, expect } from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../prismaClient";
import {execSync} from "child_process";

let token: string;

beforeAll(async () => {
    const res = await request(app)
        .post("/api/auth/login")
        .send({ username: "admin", password: "admin123" });

    token = res.body.token;
    console.log("Login response:", res.status, res.body);
    execSync("npm run reset-db", { stdio: "inherit" });
});

beforeEach(async () => {
    await prisma.tenantTransaction.deleteMany();
    await prisma.roomAssignment.deleteMany();
    await prisma.tenant.deleteMany();
});

describe("RoomAssignment routes", () => {
    it("creates a new assignment", async () => {
        const tenant = await prisma.tenant.create({ data: { name: "Mohammed Ali" } });
        const room = await prisma.room.create({ data: { name: "Room X" } });

        const res = await request(app)
            .post("/assignments")
            .set("Authorization", `Bearer ${token}`)
            .send({
                tenantId: tenant.id,
                roomId: room.id,
                startDate: new Date().toISOString(),
            });

        expect(res.status).toBe(201);
        expect(res.body.tenantId).toBe(tenant.id);
        expect(res.body.roomId).toBe(room.id);
    });

    it("prevents assignment conflict (same room and startDate)", async () => {
        const tenant = await prisma.tenant.create({ data: { name: "Bobby" } });
        const room = await prisma.room.create({ data: { name: "Room Y" } });
        const startDate = new Date().toISOString();

        await prisma.roomAssignment.create({
            data: { tenantId: tenant.id, roomId: room.id, startDate },
        });

        const res = await request(app)
            .post("/assignments")
            .set("Authorization", `Bearer ${token}`)
            .send({ tenantId: tenant.id, roomId: room.id, startDate });

        expect(res.status).toBe(409);
    });

    it("gets all assignments", async () => {
        const tenant = await prisma.tenant.create({ data: { name: "Charles White" } });
        const room = await prisma.room.create({ data: { name: "Room Z" } });

        await prisma.roomAssignment.create({
            data: {
                tenantId: tenant.id,
                roomId: room.id,
                startDate: new Date(),
            },
        });

        const res = await request(app)
            .get("/assignments")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0]).toHaveProperty("tenant");
        expect(res.body[0]).toHaveProperty("room");
    });

    it("updates an assignment's end date", async () => {
        const tenant = await prisma.tenant.create({ data: { name: "Derek" } });
        const room = await prisma.room.create({ data: { name: "Room W" } });

        const assignment = await prisma.roomAssignment.create({
            data: {
                tenantId: tenant.id,
                roomId: room.id,
                startDate: new Date(),
            },
        });

        const res = await request(app)
            .put(`/assignments/${assignment.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({
                endDate: new Date().toISOString(),
            });

        expect(res.status).toBe(200);
        expect(res.body.endDate).not.toBeNull();
    });

    it("deletes an assignment", async () => {
        const tenant = await prisma.tenant.create({ data: { name: "Eevee" } });
        const room = await prisma.room.create({ data: { name: "Room V" } });

        const assignment = await prisma.roomAssignment.create({
            data: {
                tenantId: tenant.id,
                roomId: room.id,
                startDate: new Date(),
            },
        });

        const res = await request(app)
            .delete(`/assignments/${assignment.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(204);
    });
});
