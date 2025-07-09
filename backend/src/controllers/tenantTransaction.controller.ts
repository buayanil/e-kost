import { Request, Response } from "express";
import { prisma } from "../prismaClient";
import { jwtVerify } from "jose";

export const getAllTransactions = async (_req: Request, res: Response) => {
    const payments = await prisma.tenantTransaction.findMany({
        include: {
            tenant: true,
            room: true,
            manager: {
                select: { id: true, username: true },
            },
        },
        orderBy: { paymentDate: "desc" },
    });

    res.json(payments);
};

export const getTransactionById = async (req: Request, res: Response) => {
    const { id } = req.params;

    const payment = await prisma.tenantTransaction.findUnique({
        where: { id: Number(id) },
        include: {
            tenant: true,
            room: true,
            manager: {
                select: { id: true, username: true },
            },
        },
    });

    if (!payment) {
        res.status(404).json({ message: "Transaction not found" });
        return;
    }

    res.json(payment);
};

export const createTransaction = async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
        res.status(401).json({ message: "No token provided" });
        return;
    }

    try {
        const decoded = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
        const managerId = (decoded.payload as any).id;

        const { tenantId, roomId, amount, startMonth, endMonth, notes } = req.body;

        if (!tenantId || !roomId || !amount || !startMonth || !endMonth) {
            res.status(400).json({ message: "Missing required fields" });
            return;
        }

        const transaction = await prisma.tenantTransaction.create({
            data: {
                tenantId,
                roomId,
                managerId,
                amount,
                startMonth: new Date(startMonth),
                endMonth: new Date(endMonth),
                notes,
            },
        });

        res.status(201).json(transaction);
    } catch (err) {
        res.status(401).json({ message: "Invalid token" });
    }
};

export const updateTransaction = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { notes, amount, startMonth, endMonth } = req.body;

    try {
        const updated = await prisma.tenantTransaction.update({
            where: { id: Number(id) },
            data: {
                notes,
                amount,
                startMonth: startMonth ? new Date(startMonth) : undefined,
                endMonth: endMonth ? new Date(endMonth) : undefined,
            },
        });

        res.json(updated);
    } catch (error: any) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Transaction not found" });
            return;
        }

        res.status(500).json({ message: "Server error" });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
        await prisma.tenantTransaction.delete({
            where: { id: Number(id) },
        });

        res.status(204).end();
    } catch (error: any) {
        if (error.code === "P2025") {
            res.status(404).json({ message: "Transaction not found" });
            return;
        }

        res.status(500).json({ message: "Server error" });
    }
};
