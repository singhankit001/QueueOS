import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_SqkGTWi21Bxc@ep-twilight-term-au108bzp-pooler.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
    }
  }
});

async function main() {
  const manager = await prisma.manager.findUnique({ where: { email: 'admin@queueos.com' }});
  if (!manager) {
    console.log("Admin not found!");
    return;
  }
  console.log("Admin found:", manager.email);
  const isMatch = await bcrypt.compare("password123", manager.password);
  console.log("Password match:", isMatch);
}

main().finally(() => prisma.$disconnect());
