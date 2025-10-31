import { PrismaClient } from "@prisma/client";

const email = process.argv[2];
if (!email) {
  console.error("Usage: tsx scripts\\make-admin.ts <email>");
  process.exit(1);
}

const prisma = new PrismaClient();

(async () => {
  const user = await prisma.user.update({
    where: { email },
    data: { staffRole: "ADMIN" }, // adjust field name/value to your schema if different
  });
  console.log("Promoted to admin:", { id: user.id, email: user.email, staffRole: user.staffRole });
  await prisma.$disconnect();
})().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
