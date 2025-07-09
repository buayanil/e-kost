import request from 'supertest'
import { describe, it, beforeAll, beforeEach, expect } from 'vitest'
import { prisma } from '../prismaClient'
import app from '../app'
import {execSync} from "child_process";

let token: string

beforeAll(async () => {
    const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin123' })
    token = res.body.token
    console.log('Login response:', res.status, res.body);
    execSync("npm run reset-db", { stdio: "inherit" });
})

beforeEach(async () => {
    await prisma.tenantTransaction.deleteMany()
    await prisma.roomAssignment.deleteMany()
    await prisma.tenant.deleteMany()
})


describe('Tenant API', () => {
    it('creates a tenant', async () => {
        const res = await request(app)
            .post('/tenants')
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Alison' })

        expect(res.status).toBe(201)
        expect(res.body.name).toBe('Alison')
    })

    it('lists tenants', async () => {
        await prisma.tenant.create({ data: { name: 'Bob' } })

        const res = await request(app)
            .get('/tenants')
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.length).toBeGreaterThan(0)
        expect(res.body[0]).toHaveProperty('assignments')
    })

    it('gets a tenant by ID', async () => {
        const tenant = await prisma.tenant.create({ data: { name: 'Charlie' } })

        const res = await request(app)
            .get(`/tenants/${tenant.id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.name).toBe('Charlie')
        expect(res.body).toHaveProperty('assignments')
    })

    it('gets a tenant by name', async () => {
        await prisma.tenant.create({ data: { name: 'Daisy' } })

        const res = await request(app)
            .get(`/tenants/by-name/Daisy`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(200)
        expect(res.body.name).toBe('Daisy')
        expect(res.body).toHaveProperty('assignments')
    })

    it('updates a tenant', async () => {
        const tenant = await prisma.tenant.create({ data: { name: 'Evan' } })

        const res = await request(app)
            .put(`/tenants/${tenant.id}`)
            .set('Authorization', `Bearer ${token}`)
            .send({ name: 'Evan Updated' })

        expect(res.status).toBe(200)
        expect(res.body.name).toBe('Evan Updated')
    })

    it('deletes a tenant', async () => {
        const tenant = await prisma.tenant.create({ data: { name: 'Fred' } })

        const res = await request(app)
            .delete(`/tenants/${tenant.id}`)
            .set('Authorization', `Bearer ${token}`)

        expect(res.status).toBe(204)

        const found = await prisma.tenant.findUnique({ where: { id: tenant.id } })
        expect(found).toBeNull()
    })
})
