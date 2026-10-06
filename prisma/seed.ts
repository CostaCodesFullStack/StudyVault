// Seed opcional (apenas desenvolvimento). Uso: SEED_PASSWORD=... npm run db:seed
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
const db = new PrismaClient();
async function main() {
  const pw = process.env.SEED_PASSWORD;
  if (!pw || pw.length < 8) throw new Error("Defina SEED_PASSWORD (mín. 8 caracteres).");
  await db.user.upsert({ where: { email: "dev@studyvault.local" }, update: {}, create: { name: "Dev", email: "dev@studyvault.local", passwordHash: await bcrypt.hash(pw, 12) } });
}
main().finally(() => db.$disconnect());
