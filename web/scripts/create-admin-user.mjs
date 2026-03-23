import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  const connectionUrl = new URL(process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb({
    host: connectionUrl.hostname,
    port: connectionUrl.port ? Number(connectionUrl.port) : 3306,
    user: decodeURIComponent(connectionUrl.username),
    password: decodeURIComponent(connectionUrl.password),
    database: connectionUrl.pathname.replace(/^\//, ""),
  });

  const prisma = new PrismaClient({ adapter });

  try {
    const email = "admin@realestate.local";
    const password = "Admin@12345";
    const passwordHash = await bcrypt.hash(password, 12);

    const role = await prisma.role.findFirst({
      where: { roleName: "ADMIN", active: true },
      select: { id: true },
    });

    if (!role) {
      throw new Error("ADMIN role not found. Run npm run db:seed first.");
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        roleId: role.id,
        active: true,
        isInternal: true,
        subscriptionPlan: "PREMIUM",
        leadCredits: 9999,
      },
      create: {
        name: "System Admin",
        email,
        passwordHash,
        roleId: role.id,
        isInternal: true,
        subscriptionPlan: "PREMIUM",
        leadCredits: 9999,
      },
      select: { id: true, email: true },
    });

    console.log("ADMIN_CREATED");
    console.log(`email=${email}`);
    console.log(`password=${password}`);
    console.log(`userId=${user.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(String(error));
  process.exit(1);
});