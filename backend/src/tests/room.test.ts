import {describe, it, beforeEach, expect, beforeAll} from "vitest";
import request from "supertest";
import app from "../app";
import { prisma } from "../prismaClient";
let token: string;

beforeAll(async () => {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' })
    token = res.body.token
    console.log('Login response:', res.status, res.body);
})

beforeEach(async () => {
    await prisma.tenantTransaction.deleteMany()
    await prisma.roomAssignment.deleteMany()
    await prisma.room.deleteMany()
})

describe("Room routes", () => {
    it("creates a new room", async () => {
        const res = await request(app)
            .post("/rooms")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Room 101" });

        expect(res.status).toBe(201);
        expect(res.body.name).toBe("Room 101");
    });

    it("fails to create duplicate room", async () => {
        await prisma.room.create({ data: { name: "Duplicate Room" } });

        const res = await request(app)
            .post("/rooms")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Duplicate Room" });

        expect(res.status).toBe(409);
    });

    it("gets all rooms", async () => {
        await prisma.room.createMany({
            data: [{ name: "Room A" }, { name: "Room B" }],
        });

        const res = await request(app)
            .get("/rooms")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.length).toBeGreaterThanOrEqual(2);
        expect(res.body[0]).toHaveProperty("currentAssignment");
    });

    it("gets room by id", async () => {
        const room = await prisma.room.create({ data: { name: "Room C" } });

        const res = await request(app)
            .get(`/rooms/${room.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Room C");
        expect(res.body).toHaveProperty("currentAssignment");
    });

    it("updates a room", async () => {
        const room = await prisma.room.create({ data: { name: "Old Room" } });

        const res = await request(app)
            .put(`/rooms/${room.id}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Updated Room" });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Updated Room");
    });

    it("deletes a room without assignments or payments", async () => {
        const room = await prisma.room.create({ data: { name: "To Delete" } });

        const res = await request(app)
            .delete(`/rooms/${room.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(204);
    });

    it("fails to delete room with assignments", async () => {
        const tenant = await prisma.tenant.create({ data: { name: "John Doe" } });
        const room = await prisma.room.create({ data: { name: "With Assignment" } });

        await prisma.roomAssignment.create({
            data: {
                tenantId: tenant.id,
                roomId: room.id,
                startDate: new Date(),
            },
        });

        const res = await request(app)
            .delete(`/rooms/${room.id}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(400);
    });
});
