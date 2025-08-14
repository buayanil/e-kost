import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const firstOfMonth = (iso: string) => {
    const d = new Date(iso);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
};
const lastOfMonth = (iso: string) => {
    const d = new Date(iso);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
};

// convenience for Decimal
const dec = (v: string | number) => new Prisma.Decimal(v);

async function main() {
    // --- Clean (FK order) ---
    await prisma.roomAssignment.deleteMany();
    await prisma.tenantTransaction.deleteMany();
    await prisma.managerTransaction.deleteMany();
    await prisma.tenant.deleteMany();
    await prisma.room.deleteMany();
    await prisma.manager.deleteMany();

    // --- Managers ---
    const [admin, cashier, owner] = await Promise.all([
        prisma.manager.create({
            data: {
                username: "admin",
                passwordHash: await bcrypt.hash("admin123", 10),
            },
        }),
        prisma.manager.create({
            data: {
                username: "cashier",
                passwordHash: await bcrypt.hash("cashier123", 10),
            },
        }),
        prisma.manager.create({
            data: {
                username: "owner",
                passwordHash: await bcrypt.hash("owner123", 10),
            },
        }),
    ]);

    // --- Rooms (some with notes, some vacant) ---
    const [a101, a102, b201, c301] = await Promise.all([
        prisma.room.create({
            data: { name: "A-101", notes: "Ground floor, near entrance" },
        }),
        prisma.room.create({
            data: { name: "A-102", notes: "Next to utility room" },
        }),
        prisma.room.create({
            data: { name: "B-201", notes: "Corner room with window" },
        }),
        prisma.room.create({
            data: { name: "C-301", notes: "Top floor, currently being repainted" },
        }),
    ]);

    // --- Tenants (some with notes) ---
    const [alice, bob, carol, dave] = await Promise.all([
        prisma.tenant.create({ data: { name: "Alice", notes: "Prefers bank transfer" } }),
        prisma.tenant.create({ data: { name: "Bob" } }),
        prisma.tenant.create({ data: { name: "Carol", notes: "On waitlist" } }),
        prisma.tenant.create({ data: { name: "Dave" } }),
    ]);

    // --- Room Assignments (past, current, future) ---
    // Alice: was in A-101 (May–Jul 2025), moved to B-201 from Aug 2025 (current)
    // Bob: in A-102 from mid-July 2025 (current)
    // Dave: future booking in C-301 from Sep 2025
    // Carol: no assignment (tests 'vacant tenant' handling)
    await prisma.$transaction([
        prisma.roomAssignment.create({
            data: {
                tenantId: alice.id,
                roomId: a101.id,
                startDate: new Date("2025-05-01T00:00:00Z"),
                endDate: new Date("2025-07-31T00:00:00Z"),
            },
        }),
        prisma.roomAssignment.create({
            data: {
                tenantId: alice.id,
                roomId: b201.id,
                startDate: new Date("2025-08-01T00:00:00Z"),
            },
        }),
        prisma.roomAssignment.create({
            data: {
                tenantId: bob.id,
                roomId: a102.id,
                startDate: new Date("2025-07-15T00:00:00Z"),
            },
        }),
        prisma.roomAssignment.create({
            data: {
                tenantId: dave.id,
                roomId: c301.id,
                startDate: new Date("2025-09-01T00:00:00Z"), // future
            },
        }),
    ]);

    // --- Tenant Payments (covering multiple months, different managers) ---
    // Alice paying 300 for A-101 (May, Jun, Jul) handled by cashier
    // then 320 for B-201 (Aug, Sep) handled by admin
    const aliceA101May = {
        tenantId: alice.id,
        roomId: a101.id,
        managerId: cashier.id,
        amount: dec(300),
        startMonth: firstOfMonth("2025-05-01"),
        endMonth: lastOfMonth("2025-05-01"),
        paymentDate: new Date("2025-05-03T10:00:00Z"),
        notes: "Paid in cash at desk",
    };
    const aliceA101Jun = {
        tenantId: alice.id,
        roomId: a101.id,
        managerId: cashier.id,
        amount: dec(300),
        startMonth: firstOfMonth("2025-06-01"),
        endMonth: lastOfMonth("2025-06-01"),
        paymentDate: new Date("2025-06-02T09:30:00Z"),
        notes: "Bank transfer",
    };
    const aliceA101Jul = {
        tenantId: alice.id,
        roomId: a101.id,
        managerId: cashier.id,
        amount: dec(300),
        startMonth: firstOfMonth("2025-07-01"),
        endMonth: lastOfMonth("2025-07-01"),
        paymentDate: new Date("2025-07-05T12:15:00Z"),
        notes: "Bank transfer",
    };
    const aliceB201Aug = {
        tenantId: alice.id,
        roomId: b201.id,
        managerId: admin.id,
        amount: dec(320),
        startMonth: firstOfMonth("2025-08-01"),
        endMonth: lastOfMonth("2025-08-01"),
        paymentDate: new Date("2025-08-02T16:00:00Z"),
        notes: "Paid via mobile app",
    };
    const aliceB201Sep = {
        tenantId: alice.id,
        roomId: b201.id,
        managerId: admin.id,
        amount: dec(320),
        startMonth: firstOfMonth("2025-09-01"),
        endMonth: lastOfMonth("2025-09-01"),
        paymentDate: new Date("2025-09-03T08:45:00Z"),
        notes: "Standing order",
    };

    // Bob paying for A-102 (Jul partial + Aug); use 200 flat for simplicity
    const bobJul = {
        tenantId: bob.id,
        roomId: a102.id,
        managerId: admin.id,
        amount: dec(200),
        startMonth: firstOfMonth("2025-07-01"),
        endMonth: lastOfMonth("2025-07-01"),
        paymentDate: new Date("2025-07-31T17:00:00Z"),
        notes: "Prorated month (moved in mid-month)",
    };
    const bobAug = {
        tenantId: bob.id,
        roomId: a102.id,
        managerId: cashier.id,
        amount: dec(200),
        startMonth: firstOfMonth("2025-08-01"),
        endMonth: lastOfMonth("2025-08-01"),
        paymentDate: new Date("2025-08-04T11:05:00Z"),
        notes: "Paid in cash",
    };

    await prisma.tenantTransaction.createMany({
        data: [
            aliceA101May,
            aliceA101Jun,
            aliceA101Jul,
            aliceB201Aug,
            aliceB201Sep,
            bobJul,
            bobAug,
        ],
    });

    // --- Manager-to-Manager Transfers ---
    await prisma.managerTransaction.createMany({
        data: [
            {
                senderId: admin.id,
                receiverId: owner.id,
                amount: dec(500),
                currency: "EUR",
                paymentDate: new Date("2025-08-05T09:00:00Z"),
                notes: "Monthly deposit to owner",
            },
            {
                senderId: owner.id,
                receiverId: cashier.id,
                amount: dec(200),
                currency: "EUR",
                paymentDate: new Date("2025-08-06T14:30:00Z"),
                notes: "Change float reimbursement",
            },
            {
                senderId: cashier.id,
                receiverId: admin.id,
                amount: dec(50),
                currency: "USD", // exercise non-default currency path
                paymentDate: new Date("2025-08-10T10:10:00Z"),
                notes: "USD petty cash settlement",
            },
        ],
    });

    // --- Extra: a tenant with no payments and no room (Carol) already covered above ---
    // --- Extra: a vacant room right now? C-301 is vacant until 2025-09-01 ---

    console.log("✅ Seed complete with managers, rooms, tenants, assignments, payments, and transfers.");
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
