const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function main() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst({ where: { email: 'admin@gardenverse.vercel.app' } });
  console.log('Found user:', user?.email, 'role:', user?.role);
  if (user) {
    const match = await bcrypt.compare('Test@12345678', user.passwordHash);
    console.log('Password match:', match);
  }
  await prisma.$disconnect();
}
main();
