// src/controllers/me.controller.ts
import { Request, Response } from "express";
import { prisma } from "../prismaClient";
import bcrypt from "bcrypt";
import { jwtVerify } from "jose";

const getManagerFromToken = async (req: Request) => {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) return null;

    const decoded = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET));
    return (decoded.payload as any).id as number;
};

export const getMe = async (req: Request, res: Response) => {
    try {
        const managerId = await getManagerFromToken(req);

        if (!managerId) {
            res.status(401).json({ message: "Invalid or missing token" });
            return;
        }

        const manager = await prisma.manager.findUnique({
            where: { id: managerId },
            select: { id: true, username: true, createdAt: true },
        });

        res.json(manager);
    } catch (err) {
        res.status(500).json({ message: "Error reading profile" });
    }
};

export const updateMe = async (req: Request, res: Response) => {
    try {
        const managerId = await getManagerFromToken(req);

        if (!managerId) {
            res.status(401).json({ message: "Invalid or missing token" });
            return;
        }

        const { username, password } = req.body;

        if (!username && !password) {
            res.status(400).json({ message: "Nothing to update" });
            return;
        }

        const updateData: { username?: string; passwordHash?: string } = {};

        if (username) updateData.username = username;
        if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

        const updated = await prisma.manager.update({
            where: { id: managerId },
            data: updateData,
            select: { id: true, username: true, createdAt: true },
        });

        res.json(updated);
    } catch (err) {
        res.status(500).json({ message: "Error updating profile" });
    }
};
