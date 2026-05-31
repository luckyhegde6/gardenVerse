const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();

  try {
    const passwordHash = await bcrypt.hash('Test@12345678', 12);

    const user = await prisma.user.update({
      where: { email: 'admin@gardenverse.vercel.app' },
      data: {
        passwordHash,
        role: 'SUPER_ADMIN',
        isVerified: true,
      },
    });

    console.log(`Admin user updated: ${user.email} role=${user.role} id=${user.id}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
