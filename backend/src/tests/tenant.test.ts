import request from "supertest";
import express from "express";
import { describe, it, beforeEach, expect } from "vitest";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";

import tenantRouter from "../routes/tenant";
import { prisma } from "../prismaClient";

dotenv.config({ path: ".env.test" });

const app = express();
app.use(express.json());
app.use("/tenants", tenantRouter);

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const createJWT = async (id: number) =>
    await new SignJWT({ id }).setProtectedHeader({ alg: "HS256" }).sign(JWT_SECRET);

describe("Integration test: /tenants (real router + auth)", () => {
    let token: string;
    let managerId: number;
    let tenantId: number;

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

        const tenant = await prisma.tenant.create({ data: { name: "Alice" } });
        tenantId = tenant.id;
    });

    it("GET /tenants should return all tenants with assignments", async () => {
        const res = await request(app)
            .get("/tenants")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body[0]).toMatchObject({
            id: tenantId,
            name: "Alice",
            assignments: expect.any(Array),
        });
    });

    it("GET /tenants/:id should return specific tenant", async () => {
        const res = await request(app)
            .get(`/tenants/${tenantId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({
            id: tenantId,
            name: "Alice",
        });
    });

    it("GET /tenants/:id with non-existent ID should return 404", async () => {
        const res = await request(app)
            .get("/tenants/9999")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Tenant not found.");
    });

    it("GET /tenants/by-name/:name should return tenant by name", async () => {
        const res = await request(app)
            .get("/tenants/by-name/Alice")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.name).toBe("Alice");
    });

    it("GET /tenants/by-name/:name with unknown name should return 404", async () => {
        const res = await request(app)
            .get("/tenants/by-name/Bob")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Tenant not found.");
    });

    it("POST /tenants should create a new tenant", async () => {
        const res = await request(app)
            .post("/tenants")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Charlie" });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ name: "Charlie", id: expect.any(Number) });
    });

    it("POST /tenants with missing name should return 400", async () => {
        const res = await request(app)
            .post("/tenants")
            .set("Authorization", `Bearer ${token}`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.message).toBe("Name is required.");
    });

    it("POST /tenants with duplicate name should return 409", async () => {
        const res = await request(app)
            .post("/tenants")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "Alice" });

        expect(res.status).toBe(409);
        expect(res.body.message).toBe("Tenant already exists.");
    });

    it("PUT /tenants/:id should update tenant name", async () => {
        const res = await request(app)
            .put(`/tenants/${tenantId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "AliceUpdated" });

        expect(res.status).toBe(200);
        expect(res.body.name).toBe("AliceUpdated");
    });

    it("PUT /tenants/:id with invalid ID should return 404", async () => {
        const res = await request(app)
            .put("/tenants/9999")
            .set("Authorization", `Bearer ${token}`)
            .send({ name: "DoesNotExist" });

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Tenant not found.");
    });

    it("DELETE /tenants/:id should delete tenant", async () => {
        const res = await request(app)
            .delete(`/tenants/${tenantId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(204);

        const check = await prisma.tenant.findUnique({ where: { id: tenantId } });
        expect(check).toBeNull();
    });

    it("DELETE /tenants/:id with invalid ID should return 404", async () => {
        const res = await request(app)
            .delete("/tenants/9999")
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body.message).toBe("Tenant not found.");
    });

    it("GET /tenants without token should return 401", async () => {
        const res = await request(app).get("/tenants");
        expect(res.status).toBe(401);
    });
});
