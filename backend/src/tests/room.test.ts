import request from "supertest";
import express from "express";
import { describe, it, beforeEach, expect } from "vitest";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

import room from "../routes/room";
import { prisma } from "../prismaClient";

dotenv.config({ path: ".env.test" });

const app = express();
app.use(express.json());
app.use("/rooms", room);

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const createJWT = async (id: number) =>
    await new SignJWT({ id })
        .setProtectedHeader({ alg: "HS256" })
        .sign(JWT_SECRET);

describe("Integration test: /rooms (with real router + auth)", () => {
    let token: string;
    let managerId: number;
    let roomId: number;

    beforeEach(async () => {
        // Reset DB
        await prisma.roomAssignment.deleteMany();
        await prisma.tenantTransaction.deleteMany();
        await prisma.managerTransaction.deleteMany();
        await prisma.tenant.deleteMany();
        await prisma.room.deleteMany();
        await prisma.manager.deleteMany();

        // Create test manager
        const passwordHash = await bcrypt.hash("password123", 10);
        const manager = await prisma.manager.create({
            data: { username: "admin", passwordHash },
        });

        managerId = manager.id;
        token = await createJWT(managerId);

        // Create test room
        const room = await prisma.room.create({ data: { name: "Room A" } });
        roomId = room.id;
    });

    it("GET /rooms should return list of rooms", async () => {
        const res = await request(app)
            .get("/rooms")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual([
            expect.objectContaining({
                id: roomId,
                name: "Room A",
                createdAt: expect.any(String),
                currentAssignment: null,
                notes: null,
            }),
        ]);
    });

    it("GET /rooms/:id should return room by ID", async () => {
        const res = await request(app)
            .get(`/rooms/${roomId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            id: roomId,
            name: "Room A",
            createdAt: expect.any(String),
            currentAssignment: null,
            notes: null
        });
    });

    it("GET /rooms/:id with non-existing ID should return 404", async () => {
        const res = await request(app)
            .get("/rooms/9999")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Room not found");
    });

    it("POST /rooms should create a new room", async () => {
        const res = await request(app)
            .post("/rooms")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Room B" });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ name: "Room B", id: expect.any(Number) });
    });

    it("POST /rooms with duplicate name should return 409", async () => {
        const res = await request(app)
            .post("/rooms")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Room A" });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Room name already exists");
    });

    it("POST /rooms with missing name should return 400", async () => {
        const res = await request(app)
            .post("/rooms")
            .set("Authorization", `Bearer ${token}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Name is required");
    });

    it("PUT /rooms/:id should update room name", async () => {
        const res = await request(app)
            .put(`/rooms/${roomId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Updated Room A", notes: "Updated notes" });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Updated Room A");
        expect(res.body.notes).toBe("Updated notes");
    });

    it("PUT /rooms/:id with non-existing ID should return 404", async () => {
        const res = await request(app)
            .put("/rooms/9999")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "X" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Room not found");
    });

    it("DELETE /rooms/:id should delete room if no relations", async () => {
        const res = await request(app)
            .delete(`/rooms/${roomId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(204);

        const exists = await prisma.room.findUnique({ where: { id: roomId } });
        expect(exists).toBeNull();
    });

    it("DELETE /rooms/:id with non-existing ID should return 404", async () => {
        const res = await request(app)
            .delete("/rooms/9999")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Room not found");
    });

    it("DELETE /rooms/:id with existing assignment should return 400", async () => {
        const tenant = await prisma.tenant.create({ data: { name: "Tenant A" } });

        await prisma.roomAssignment.create({
            data: {
                roomId,
                tenantId: tenant.id,
                startDate: new Date(),
            },
        });

        const res = await request(app)
            .delete(`/rooms/${roomId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Room has existing relations");
    });

    it("GET /rooms without token should return 401", async () => {
        const res = await request(app).get("/rooms");
        expect(res.status).toBe(401);
    });
});
