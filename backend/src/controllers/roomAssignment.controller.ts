import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export const getAllAssignments = async (_req: Request, res: Response) => {
    const assignments = await prisma.roomAssignment.findMany({
        include: {
            tenant: true,
            room: true,
        },
        orderBy: { startDate: "desc" },
    });

    res.json(assignments);
};

export const createAssignment = async (req: Request, res: Response) => {
    const { tenantId, roomId, startDate } = req.body;

    if (!tenantId || !roomId || !startDate) {
        res.status(400).json({ message: "Missing tenantId, roomId or startDate" });
        return;
    }

    try {
        const assignment = await prisma.roomAssignment.create({
            data: {
                tenantId,
                roomId,
                startDate: new Date(startDate),
            },
            include: {
                tenant: true,
                room: true,
            },
        });

        res.status(201).json(assignment);
    } catch (error: any) {
        if (error.code === "P2002") {
            res.status(409).json({ message: "Assignment conflict: room already assigned at this time" });
            return;
        }

        res.status(500).json({ message: "Server error" });
    }
};

export const updateAssignment = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { endDate } = req.body;

    try {
        const updated = await prisma.roomAssignment.update({
            where: { id: Number(id) },
            data: { endDate: endDate ? new Date(endDate) : null },
        });

        res.json(updated);
    } catch (error: any) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Assignment not found" });
            return;
        }

        res.status(500).json({ message: "Server error" });
    }
};

export const deleteAssignment = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.roomAssignment.delete({
            where: { id: Number(id) },
        });

        res.status(204).end();
    } catch (error: any) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Assignment not found" });
            return;
        }

        res.status(500).json({ message: "Server error" });
    }
};
