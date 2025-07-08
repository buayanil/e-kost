import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Create a manager
    const passwordHash = await bcrypt.hash("admin123", 10);
    const manager = await prisma.manager.create({
        data: {
            username: "admin",
            passwordHash,
        },
    });

    // Create rooms
    const roomA = await prisma.room.create({ data: { name: "A-101" } });
    const roomB = await prisma.room.create({ data: { name: "B-201" } });

    // Create tenants
    const tenant1 = await prisma.tenant.create({ data: { name: "Alice" } });
    const tenant2 = await prisma.tenant.create({ data: { name: "Bob" } });

    // Assign tenants to rooms
    await prisma.roomAssignment.create({
        data: {
            tenantId: tenant1.id,
            roomId: roomA.id,
            startDate: new Date("2025-07-01"),
        },
    });

    await prisma.roomAssignment.create({
        data: {
            tenantId: tenant2.id,
            roomId: roomB.id,
            startDate: new Date("2025-07-01"),
        },
    });

    // Record a tenant payment
    await prisma.tenantTransaction.create({
        data: {
            tenantId: tenant1.id,
            roomId: roomA.id,
            managerId: manager.id,
            amount: 300,
            startMonth: new Date("2025-07-01"),
            endMonth: new Date("2025-07-31"),
            paymentDate: new Date(),
            notes: "Paid in cash",
        },
    });

    // Record a manager-to-manager transaction
    await prisma.managerTransaction.create({
        data: {
            senderId: manager.id,
            receiverId: manager.id, // just for testing — usually a different manager
            amount: 150,
            notes: "Transferred to backup fund",
        },
    });

    console.log("✅ Seed complete");
}

main()
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect());
