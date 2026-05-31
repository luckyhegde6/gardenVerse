const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();

  try {
    // Check if admin already exists
    const existing = await prisma.user.findFirst({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
    });

    if (existing) {
      console.log(`Admin user already exists: ${existing.email}`);
      return;
    }

    // Generate password hash
    const passwordHash = await bcrypt.hash('Test@12345678', 12);

    const user = await prisma.user.create({
      data: {
        email: 'admin@gardenverse.test',
        username: 'admin',
        displayName: 'Admin User',
        passwordHash,
        role: 'SUPER_ADMIN',
        isVerified: true,
        isOnboarded: true,
        level: 50,
        experience: 10000,
        greenCredits: 5000,
        ecoPoints: 2500,
        trustScore: 100,
        sustainabilityScore: 85,
        currentStreak: 30,
        geoHash: '9q8yy',
      },
    });

    console.log(`Admin user created: ${user.email} (${user.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
