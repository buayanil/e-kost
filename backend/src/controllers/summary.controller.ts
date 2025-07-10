import { Request, Response } from "express";
import { prisma } from "../prismaClient";

export const getSummary = async (_req: Request, res: Response) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const [totalRooms, occupiedRooms, totalTenants, incomeThisMonth] =
        await Promise.all([
            prisma.room.count(),
            prisma.roomAssignment.count({
                where: { endDate: null },
            }),
            prisma.tenant.count(),
            prisma.tenantTransaction.aggregate({
                _sum: {
                    amount: true,
                },
                where: {
                    paymentDate: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            }),
        ]);

    res.json({
        totalRooms,
        occupiedRooms,
        totalTenants,
        totalIncomeThisMonth:
            incomeThisMonth._sum.amount?.toFixed(2) ?? "0.00",
    });
};
