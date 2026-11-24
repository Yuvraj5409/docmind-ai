import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

// Load the database credentials from the project-root .env
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({
    path: path.resolve(currentDirectory, "../../../.env"),
});

// Make sure the database URL exists
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is missing from the root .env file");
}

// Create the PostgreSQL driver adapter
const adapter = new PrismaPg({ connectionString });

// Create one shared Prisma Client instance
export const prisma = new PrismaClient({ adapter });