import { execSync } from "child_process";

export function resetTestDb() {
    execSync("npx prisma db push --force-reset", { stdio: "inherit" });
    execSync("npx ts-node prisma/seed.ts", { stdio: "inherit" });
}
