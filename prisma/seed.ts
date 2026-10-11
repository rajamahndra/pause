import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
await db.$queryRaw`SELECT 1`;
console.log("Pause: database siap. Edukasi berasal dari content/education. Tidak ada akun atau jurnal yang dibuat oleh seed.");
await db.$disconnect();
