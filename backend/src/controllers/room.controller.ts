import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export const getAllRooms = async (_req: Request, res: Response) => {
    const rooms = await prisma.room.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            assignments: {
                where: { endDate: null },
                include: { tenant: true },
                orderBy: { startDate: "desc" },
                take: 1,
            },
        },
    });

    const result = rooms.map((room) => {
        const currentAssignment = room.assignments[0] || null;
        const { assignments, ...roomData } = room;

        return {
            ...roomData,
            currentAssignment: currentAssignment
                ? {
                    tenant: {
                        id: currentAssignment.tenant.id,
                        name: currentAssignment.tenant.name,
                    },
                    startDate: currentAssignment.startDate,
                    endDate: currentAssignment.endDate,
                }
                : null,
        };
    });

    res.json(result);
};


export const getRoomById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const room = await prisma.room.findUnique({
        where: { id: Number(id) },
        include: {
            assignments: {
                where: { endDate: null },
                include: { tenant: true },
                orderBy: { startDate: "desc" },
                take: 1,
            },
        },
    });

    if (!room) {
        res.status(404).json({ message: "Room not found" });
        return;
    }

    const currentAssignment = room.assignments[0] || null;
    const { assignments, ...roomData } = room;

    res.json({
        ...roomData,
        currentAssignment: currentAssignment
            ? {
                tenant: {
                    id: currentAssignment.tenant.id,
                    name: currentAssignment.tenant.name,
                },
                startDate: currentAssignment.startDate,
                endDate: currentAssignment.endDate,
            }
            : null,
    });
};

export const createRoom = async (req: Request, res: Response) => {
    const { name } = req.body;

    if (!name) {
        res.status(400).json({ message: "Name is required" });
        return;
    }

    try {
        const room = await prisma.room.create({ data: { name } });
        res.status(201).json(room);
    } catch (error: any) {
        if (error.code === "P2002") {
            res.status(409).json({ message: "Room name already exists" });
            return;
        }
        res.status(500).json({ message: "Server error" });
    }
};

export const updateRoom = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    try {
        const updated = await prisma.room.update({
            where: { id: Number(id) },
            data: { name },
        });
        res.json(updated);
    } catch (error: any) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Room not found" });
            return;
        }
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteRoom = async (req: Request, res: Response) => {
    const { id } = req.params;

    const hasRelations = await prisma.room.findUnique({
        where: { id: Number(id) },
        include: {
            assignments: true,
            payments: true,
        },
    });

    if (!hasRelations) {
        res.status(404).json({ message: "Room not found" });
        return;
    }

    if (hasRelations.assignments.length || hasRelations.payments.length) {
        res.status(400).json({ message: "Room has existing relations" });
        return;
    }

    await prisma.room.delete({ where: { id: Number(id) } });
    res.status(204).end();
};