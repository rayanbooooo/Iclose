import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import ws from "ws";

import { PrismaClient } from "@/generated/prisma/client";

// Neon's serverless driver needs a WebSocket implementation outside edge
// runtimes (Node.js doesn't have `WebSocket` built in the way browsers/edge do).
neonConfig.webSocketConstructor = ws;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Deliberately not validated eagerly at module scope: Next.js evaluates this
// module while collecting page data at build time, before DATABASE_URL is
// necessarily available (or needed yet). An empty connection string only
// becomes a problem when a query actually runs, which is the right time to
// surface it — the adapter/driver error at that point is clear enough.
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL ?? "" });

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
