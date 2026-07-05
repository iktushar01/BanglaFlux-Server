import "dotenv/config";
import { prisma } from "../src/app/lib/prisma";

async function main() {
  const count = await prisma.channel.count();
  const active = await prisma.channel.count({ where: { isActive: true } });
  const sample = await prisma.channel.findMany({
    take: 5,
    select: { id: true, name: true, category: true, isActive: true },
  });
  console.log(JSON.stringify({ count, active, sample }, null, 2));
}

main().finally(() => prisma.$disconnect());
