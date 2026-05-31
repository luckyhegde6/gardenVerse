// GardenVerse Database Seed Script
// Run with: node scripts/seed-data.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GardenVerse database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@gardenverse.vercel.app' },
    update: {},
    create: {
      email: 'admin@gardenverse.vercel.app',
      username: 'admin',
      displayName: 'Admin',
      passwordHash: adminPassword,
      role: 'SUPER_ADMIN',
      isVerified: true,
      isOnboarded: true,
      level: 50,
      experience: 100000,
      greenCredits: 10000,
      ecoPoints: 50000,
      sustainabilityScore: 1000,
      trustScore: 100,
      currentStreak: 100,
    },
  });
  console.log(`  ✓ Admin user created: ${admin.email}`);

  // Create test user
  const userPassword = await bcrypt.hash('Test@123456', 12);
  const testUser = await prisma.user.upsert({
    where: { email: 'test@gardenverse.vercel.app' },
    update: {},
    create: {
      email: 'test@gardenverse.vercel.app',
      username: 'testgardener',
      displayName: 'Test Gardener',
      passwordHash: userPassword,
      role: 'USER',
      isVerified: true,
      isOnboarded: true,
      level: 15,
      experience: 15000,
      greenCredits: 500,
      ecoPoints: 2500,
      sustainabilityScore: 500,
      trustScore: 85,
      currentStreak: 30,
      longestStreak: 45,
      region: 'IN-MH',
      geohash: 'te7s8',
    },
  });
  console.log(`  ✓ Test user created: ${testUser.email}`);

  // Create garden for test user
  const garden = await prisma.garden.upsert({
    where: { userId: testUser.id },
    update: {},
    create: {
      name: 'My Garden',
      type: 'HYBRID',
      description: 'My first hybrid garden',
      size: 4,
      soilQuality: 65,
      irrigationLevel: 55,
      sunlightExposure: 70,
      userId: testUser.id,
    },
  });
  console.log(`  ✓ Garden created: ${garden.name}`);

  // Create crops
  const crops = [
    { name: 'Tomato', species: 'Solanum lycopersicum', status: 'GROWING', growthStage: 45, health: 85, hydration: 60, nutrientLevel: 55, plotX: 0, plotY: 0 },
    { name: 'Basil', species: 'Ocimum basilicum', status: 'MATURE', growthStage: 90, health: 90, hydration: 50, nutrientLevel: 65, plotX: 1, plotY: 0 },
    { name: 'Lettuce', species: 'Lactuca sativa', status: 'SPROUTING', growthStage: 15, health: 75, hydration: 70, nutrientLevel: 45, plotX: 0, plotY: 1 },
    { name: 'Carrot', species: 'Daucus carota', status: 'SEED', growthStage: 0, health: 100, hydration: 50, nutrientLevel: 50, plotX: 1, plotY: 1 },
  ];

  for (const cropData of crops) {
    await prisma.crop.create({
      data: {
        ...cropData,
        gardenId: garden.id,
        userId: testUser.id,
        plantedAt: new Date(Date.now() - cropData.growthStage * 86400000),
      },
    });
  }
  console.log(`  ✓ ${crops.length} crops planted`);

  // Create marketplace listings
  const listing = await prisma.marketplaceListing.create({
    data: {
      title: 'Organic Tomato Seeds',
      description: 'Heirloom tomato seeds, non-GMO, organic',
      category: 'SEEDS',
      price: 50,
      currency: 'GREEN_CREDITS',
      quantity: 10,
      sellerId: testUser.id,
      isLocal: true,
    },
  });
  console.log(`  ✓ Marketplace listing created: ${listing.title}`);

  // Create inventory items
  const items = [
    { itemType: 'SEED', itemId: 'seed-tomato-001', name: 'Tomato Seeds', quantity: 5, rarity: 'COMMON' },
    { itemType: 'SEED', itemId: 'seed-basil-001', name: 'Basil Seeds', quantity: 3, rarity: 'UNCOMMON' },
    { itemType: 'FERTILIZER', itemId: 'fert-organic-001', name: 'Organic Fertilizer', quantity: 10, rarity: 'COMMON' },
    { itemType: 'TOOL', itemId: 'tool-watering-001', name: 'Premium Watering Can', quantity: 1, rarity: 'RARE' },
  ];

  for (const item of items) {
    await prisma.inventory.create({
      data: { ...item, userId: testUser.id },
    });
  }
  console.log(`  ✓ ${items.length} inventory items created`);

  // Create feature flags
  const flags = [
    { name: 'ai_diagnosis_v1', enabled: true, description: 'AI plant diagnosis feature' },
    { name: 'marketplace_enabled', enabled: true, description: 'Marketplace feature' },
    { name: 'iot_beta', enabled: false, description: 'IoT integration (beta)' },
    { name: 'blockchain_beta', enabled: false, description: 'Blockchain integration (beta)' },
    { name: 'regional_feed_enabled', enabled: true, description: 'Regional community feed' },
    { name: 'invite_only', enabled: true, description: 'Invite-only access mode' },
  ];

  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { name: flag.name },
      update: {},
      create: flag,
    });
  }
  console.log(`  ✓ ${flags.length} feature flags created`);

  // Create weather record
  await prisma.weatherRecord.create({
    data: {
      region: 'IN-MH',
      temperature: 28.5,
      humidity: 65,
      rainfall: 0,
      windSpeed: 12,
      sunlightHours: 8.5,
      condition: 'CLEAR',
      forecast: JSON.stringify([
        { date: new Date().toISOString(), temperature: 28, humidity: 65, condition: 'CLEAR' },
        { date: new Date(Date.now() + 86400000).toISOString(), temperature: 27, humidity: 70, condition: 'CLOUDY' },
        { date: new Date(Date.now() + 2 * 86400000).toISOString(), temperature: 26, humidity: 75, condition: 'RAIN' },
      ]),
      alerts: JSON.stringify([]),
    },
  });
  console.log('  ✓ Weather record created');

  // Create notification
  await prisma.notification.create({
    data: {
      type: 'WATERING_REMINDER',
      title: 'Time to water your garden!',
      body: 'Your tomato plants need watering. Soil moisture is below optimal levels.',
      userId: testUser.id,
    },
  });
  console.log('  ✓ Sample notification created');

  // Create community group
  const group = await prisma.group.create({
    data: {
      name: 'Mumbai Gardeners',
      description: 'A community for gardeners in Mumbai region',
      type: 'REGIONAL',
      region: 'IN-MH',
      members: {
        create: { userId: testUser.id, role: 'ADMIN' },
      },
    },
  });
  console.log(`  ✓ Community group created: ${group.name}`);

  console.log('\n✅ Database seeding complete!');
  console.log('\nTest credentials:');
  console.log('  Admin: admin@gardenverse.vercel.app / Admin@123456');
  console.log('  User:  test@gardenverse.vercel.app / Test@123456');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
