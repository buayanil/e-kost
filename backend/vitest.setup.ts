import { execSync } from 'node:child_process'
import { join } from 'node:path'
import { config } from 'dotenv'

config()

const workerId = process.env.VITEST_WORKER_ID ?? '0'
const dbPath = join(__dirname, `test-db-${workerId}.sqlite`)

// Make sure Prisma uses this DB
process.env.DATABASE_URL = `file:${dbPath}`

// Recreate DB schema without seed data
execSync(`npx prisma migrate reset --force --skip-seed`, { stdio: 'inherit' })
