import { Request, Response } from 'express'
import { prisma } from '../prismaClient'

// GET /tenants
export const getAllTenants = async (req: Request, res: Response) => {
    try {
        const tenants = await prisma.tenant.findMany({
            include: {
                assignments: {
                    include: {
                        room: true,
                    },
                },
            },
        })
        res.json(tenants)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to fetch tenants.' })
    }
}

// GET /tenants/:id
export const getTenantById = async (req: Request, res: Response) => {
    const id = Number(req.params.id)

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { id },
            include: {
                assignments: {
                    include: { room: true },
                },
            },
        })

        if (!tenant) {
            res.status(404).json({ message: 'Tenant not found.' })
            return
        }

        res.json(tenant)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to fetch tenant.' })
    }
}

// GET /tenants/by-name/:name
export const getTenantByName = async (req: Request, res: Response) => {
    const name = req.params.name

    try {
        const tenant = await prisma.tenant.findUnique({
            where: { name },
            include: {
                assignments: {
                    include: { room: true },
                },
            },
        })

        if (!tenant) {
            res.status(404).json({ message: 'Tenant not found.' })
            return
        }

        res.json(tenant)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: 'Failed to fetch tenant.' })
    }
}

// POST /tenants
export const createTenant = async (req: Request, res: Response) => {
    const { name } = req.body
    if (!name) {
        res.status(400).json({ message: 'Name is required.' })
        return
    }

    try {
        const newTenant = await prisma.tenant.create({ data: { name } })
        res.status(201).json(newTenant)
    } catch (error: any) {
        if (error.code === 'P2002') {
            res.status(409).json({ message: 'Tenant already exists.' })
        } else {
            console.error(error)
            res.status(500).json({ message: 'Failed to create tenant.' })
        }
    }
}

// PUT /tenants/:id
export const updateTenant = async (req: Request, res: Response) => {
    const tenantId = Number(req.params.id)
    const { name } = req.body

    try {
        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { name },
        })
        res.json(updatedTenant)
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Tenant not found.' })
        } else {
            console.error(error)
            res.status(500).json({ message: 'Failed to update tenant.' })
        }
    }
}

// DELETE /tenants/:id
export const deleteTenant = async (req: Request, res: Response) => {
    const tenantId = Number(req.params.id)

    try {
        await prisma.tenant.delete({ where: { id: tenantId } })
        res.status(204).send()
    } catch (error: any) {
        if (error.code === 'P2025') {
            res.status(404).json({ message: 'Tenant not found.' })
        } else {
            console.error(error)
            res.status(500).json({ message: 'Failed to delete tenant.' })
        }
    }
}