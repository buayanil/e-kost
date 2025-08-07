# e-kost — Backend Setup (Express + Prisma + Vitest)
A transaction manager for boarding houses. The backend uses Express, Prisma ORM, and SQLite (or PostgreSQL). It provides routes for authentication, tenant and room management, and transaction tracking.

## Install Dependencies
Navigate to the backend folder and install:

```bash
cd backend
npm install
```

## Environment Variables
Create a `.env` file in the backend/ directory with the following contents:

```bash
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET=super-secret-key
```

Alternatively, use a .env.example as a base template.

## Reset and Seed the Database
To wipe the database and reseed with test data:
```bash
npm run reseed-db
```

This will:

- Delete prisma/dev.db

- Run prisma db push to generate the schema

- Execute the seed script (prisma/seed.ts) which creates:

    * A manager (username: admin, password: admin123)

    * Rooms: A-101, B-201

    * Tenants: Alice, Bob

    * Assignments and transactions for testing

## Start Development Server
```bash
npm run dev
```
This starts the Express server on port 4000.
The dev db is also reseeded.

## Run Automated Tests
```bash
npm run test
```

What happens:

- The dev db is reset but not reseeded
- Tests are executed using vitest and supertest
- Please note that the test clears your dev-db, use `npm run reset-db` to fill it again

## Project Notes
- The server only starts when `NODE_ENV !== 'test'`. This allows testing to import `app` without auto-starting the listener.

- Test errors related to foreign keys or duplicates mean your cleanup (`afterEach`) needs to consider table relations. (Use `deleteMany` in correct order or truncate all in one go.)

- You can inspect the database file with any SQLite GUI (like DB Browser for SQLite) by opening `prisma/dev.db`.