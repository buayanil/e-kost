import { RequestHandler } from "express";
import { prisma } from "../prismaClient";
import bcrypt from "bcrypt";

const getManagerIdFromReq = (req: any): number | null => {
    const raw =
        req.managerId ??                  // e.g. middleware sets ID here
        req.userId ??                     // or maybe here
        req.user?.id ??                   // or attaches a user object
        req.manager?.id;                  // or a manager object

    if (raw == null) return null;
    const n = typeof raw === "string" ? parseInt(raw, 10) : raw;
    return Number.isFinite(n) ? n : null;
};

export const getMe: RequestHandler = async (req, res) => {
    const id = getManagerIdFromReq(req);
    if (!id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const manager = await prisma.manager.findUnique({
        where: { id },
        select: { id: true, username: true, createdAt: true },
    });

    if (!manager) {
        res.status(401).json({ message: "Account not found" });
        return;
    }

    res.json(manager);
};

export const updateMe: RequestHandler = async (req, res) => {
    const id = getManagerIdFromReq(req);
    if (!id) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const { username, password } = req.body;
    if (!username && !password) {
        res.status(400).json({ message: "Nothing to update" });
        return;
    }

    const data: { username?: string; passwordHash?: string } = {};
    if (username) data.username = username;
    if (password) data.passwordHash = await bcrypt.hash(password, 10);

    const updated = await prisma.manager.update({
        where: { id },
        data,
        select: { id: true, username: true, createdAt: true },
    });

    res.json(updated);
};
