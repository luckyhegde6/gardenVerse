import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const tables = [
    'tokenTransaction', 'appLog', 'session', 'auditLog',
    'userFeatureOverride', 'reputationLog', 'blockchainTransaction',
    'qrSession', 'moderationReport', 'sensorReading', 'iotDevice',
    'marketplaceTransaction', 'marketplaceListing', 'inventory',
    'message', 'groupMember', 'group', 'invite', 'aiScan',
    'notification', 'gardenPlanPlant', 'gardenPlan', 'cropVariety',
    'crop', 'weatherRecord', 'garden', 'plantCollection', 'speciesMastery', 'plantHybrid', 'plantSpecies', 'featureFlag',
    'dailyReward', 'userEnergy', 'userAchievement', 'achievement', 'userPurchase', 'shopItem', 'user',
  ];
  for (const t of tables) {
    try { await (prisma as any)[t].deleteMany(); } catch { }
  }

  const hash = await bcrypt.hash('password123', 12);

  const superadminId = uuidv4();
  const adminId = uuidv4();
  const demoId = uuidv4();

  await prisma.user.create({
    data: {
      id: superadminId, email: 'superadmin@gardenverse.vercel.app', username: 'superadmin',
      displayName: 'Super Admin', passwordHash: hash, role: 'SUPER_ADMIN',
      isVerified: true, isOnboarded: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=superadmin',
      bio: 'GardenVerse super administrator.', geohash: '9q9h8', region: 'IN-KA',
      level: 99, experience: 99999, greenCredits: 99999, ecoPoints: 99999,
      sustainabilityScore: 100, trustScore: 100, marketplaceReliability: 100,
      communityStanding: 100, inviteCount: 999, currentStreak: 365, longestStreak: 365,
      lastActiveAt: new Date(),
    },
  });
  await prisma.user.create({
    data: {
      id: adminId, email: 'admin@gardenverse.vercel.app', username: 'admin',
      displayName: 'Admin Gardener', passwordHash: hash, role: 'ADMIN',
      isVerified: true, isOnboarded: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
      bio: 'GardenVerse platform administrator.', geohash: '9q9h8', region: 'IN-KA',
      level: 50, experience: 25000, greenCredits: 10000, ecoPoints: 5000,
      sustainabilityScore: 98.5, trustScore: 100, marketplaceReliability: 100,
      communityStanding: 100, inviteCount: 25, currentStreak: 30, longestStreak: 60,
      lastActiveAt: new Date(),
    },
  });
  await prisma.user.create({
    data: {
      id: demoId, email: 'demo@gardenverse.vercel.app', username: 'demo_user',
      displayName: 'Demo User', passwordHash: hash, role: 'USER',
      isVerified: true, isOnboarded: true,
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
      bio: 'Demo user with a virtual garden.', geohash: '9q9h8', region: 'IN-KA',
      level: 5, experience: 1200, greenCredits: 500, ecoPoints: 200,
      sustainabilityScore: 45, trustScore: 50, marketplaceReliability: 40,
      communityStanding: 35, inviteCount: 1, currentStreak: 3, longestStreak: 7,
      lastActiveAt: new Date(),
    },
  });

  console.log('Created 3 users: superadmin, admin, demo (password: password123)');

  // ─── Plant Species ──────────────────────────────────────────────────────
  const plants = [
    { commonName: 'Tomato', scientificName: 'Solanum lycopersicum', family: 'Solanaceae', growingDays: 65, difficulty: 'EASY', waterNeeds: 'MODERATE', sunlightNeeds: 'FULL_SUN', seasons: ['spring', 'summer'], edible: true, tags: ['tomato', 'vegetable', 'fruit'], minTemp: 15, maxTemp: 35, description: 'A versatile red fruit used in cuisines worldwide. Grows well in warm weather with consistent watering.' },
    { commonName: 'Chilli', scientificName: 'Capsicum annuum', family: 'Solanaceae', growingDays: 75, difficulty: 'MEDIUM', waterNeeds: 'MODERATE', sunlightNeeds: 'FULL_SUN', seasons: ['spring', 'summer'], edible: true, tags: ['chilli', 'pepper', 'vegetable', 'indian'], minTemp: 18, maxTemp: 38, description: 'Indian green chilli — essential for tempering and spice in South Asian cooking.' },
    { commonName: 'Turmeric', scientificName: 'Curcuma longa', family: 'Zingiberaceae', growingDays: 90, difficulty: 'MEDIUM', waterNeeds: 'HIGH', sunlightNeeds: 'PARTIAL_SHADE', seasons: ['spring', 'summer'], edible: true, medicinal: true, tags: ['turmeric', 'indian', 'spice', 'medicinal'], minTemp: 20, maxTemp: 35, description: 'Golden rhizome used as spice and medicine. Requires warm, humid conditions.' },
    { commonName: 'Rice', scientificName: 'Oryza sativa', family: 'Poaceae', growingDays: 120, difficulty: 'HARD', waterNeeds: 'HIGH', sunlightNeeds: 'FULL_SUN', seasons: ['summer', 'fall'], edible: true, tags: ['rice', 'grain', 'indian', 'staple'], minTemp: 20, maxTemp: 40, description: 'Staple grain of India. Requires flooded paddy conditions and warm temperatures.' },
    { commonName: 'Okra', scientificName: 'Abelmoschus esculentus', family: 'Malvaceae', growingDays: 55, difficulty: 'EASY', waterNeeds: 'MODERATE', sunlightNeeds: 'FULL_SUN', seasons: ['spring', 'summer'], edible: true, tags: ['okra', 'bhindi', 'vegetable', 'indian'], minTemp: 20, maxTemp: 40, description: 'Also known as bhindi or ladies fingers. Fast-growing warm season vegetable.' },
    { commonName: 'Brinjal', scientificName: 'Solanum melongena', family: 'Solanaceae', growingDays: 70, difficulty: 'MEDIUM', waterNeeds: 'MODERATE', sunlightNeeds: 'FULL_SUN', seasons: ['spring', 'summer'], edible: true, tags: ['brinjal', 'eggplant', 'aubergine', 'vegetable', 'indian'], minTemp: 18, maxTemp: 38, description: 'Purple eggplant, known as brinjal in India. Grows best in warm weather.' },
    { commonName: 'Spinach', scientificName: 'Spinacia oleracea', family: 'Amaranthaceae', growingDays: 40, difficulty: 'EASY', waterNeeds: 'MODERATE', sunlightNeeds: 'PARTIAL_SHADE', seasons: ['winter', 'spring'], edible: true, tags: ['spinach', 'leafy', 'green', 'vegetable'], minTemp: 5, maxTemp: 25, description: 'Fast-growing leafy green. Prefers cooler weather for best growth.' },
    { commonName: 'Coriander', scientificName: 'Coriandrum sativum', family: 'Apiaceae', growingDays: 30, difficulty: 'EASY', waterNeeds: 'MODERATE', sunlightNeeds: 'PARTIAL_SHADE', seasons: ['winter', 'spring', 'fall'], edible: true, tags: ['coriander', 'cilantro', 'herb', 'indian'], minTemp: 10, maxTemp: 30, description: 'Fresh coriander leaves are essential for Indian cooking. Quick-growing herb.' },
    { commonName: 'Mint', scientificName: 'Mentha spicata', family: 'Lamiaceae', growingDays: 25, difficulty: 'EASY', waterNeeds: 'HIGH', sunlightNeeds: 'PARTIAL_SHADE', seasons: ['spring', 'summer', 'fall'], edible: true, medicinal: true, tags: ['mint', 'pudina', 'herb', 'indian'], minTemp: 10, maxTemp: 35, description: 'Also known as pudina. Vigorous grower that spreads via runners.' },
    { commonName: 'Carrot', scientificName: 'Daucus carota', family: 'Apiaceae', growingDays: 70, difficulty: 'EASY', waterNeeds: 'MODERATE', sunlightNeeds: 'FULL_SUN', seasons: ['winter', 'spring', 'fall'], edible: true, tags: ['carrot', 'root', 'vegetable'], minTemp: 5, maxTemp: 30, description: 'Root vegetable rich in beta-carotene. Needs loose, sandy soil.' },
    { commonName: 'Cauliflower', scientificName: 'Brassica oleracea', family: 'Brassicaceae', growingDays: 80, difficulty: 'HARD', waterNeeds: 'HIGH', sunlightNeeds: 'FULL_SUN', seasons: ['winter', 'fall'], edible: true, tags: ['cauliflower', 'brassica', 'vegetable'], minTemp: 5, maxTemp: 25, description: 'Cool-season crop that requires consistent moisture and nutrient-rich soil.' },
    { commonName: 'Onion', scientificName: 'Allium cepa', family: 'Amaryllidaceae', growingDays: 100, difficulty: 'EASY', waterNeeds: 'MODERATE', sunlightNeeds: 'FULL_SUN', seasons: ['winter', 'spring'], edible: true, tags: ['onion', 'bulb', 'vegetable', 'indian'], minTemp: 5, maxTemp: 30, description: 'Foundational ingredient in almost every Indian dish.' },
    { commonName: 'Garlic', scientificName: 'Allium sativum', family: 'Amaryllidaceae', growingDays: 90, difficulty: 'EASY', waterNeeds: 'LOW', sunlightNeeds: 'FULL_SUN', seasons: ['winter', 'spring'], edible: true, medicinal: true, tags: ['garlic', 'bulb', 'vegetable', 'medicinal'], minTemp: 5, maxTemp: 30, description: 'Pungent bulb used for flavor and health benefits.' },
    { commonName: 'Cucumber', scientificName: 'Cucumis sativus', family: 'Cucurbitaceae', growingDays: 55, difficulty: 'EASY', waterNeeds: 'HIGH', sunlightNeeds: 'FULL_SUN', seasons: ['spring', 'summer'], edible: true, tags: ['cucumber', 'kheera', 'vegetable'], minTemp: 15, maxTemp: 35, description: 'Refreshing summer vegetable that grows on vines.' },
    { commonName: 'Pumpkin', scientificName: 'Cucurbita pepo', family: 'Cucurbitaceae', growingDays: 100, difficulty: 'EASY', waterNeeds: 'HIGH', sunlightNeeds: 'FULL_SUN', seasons: ['spring', 'summer'], edible: true, tags: ['pumpkin', 'squash', 'vegetable'], minTemp: 15, maxTemp: 35, description: 'Large trailing vine producing big orange fruits.' },
    { commonName: 'Sunflower', scientificName: 'Helianthus annuus', family: 'Asteraceae', growingDays: 70, difficulty: 'EASY', waterNeeds: 'LOW', sunlightNeeds: 'FULL_SUN', seasons: ['spring', 'summer'], edible: true, tags: ['sunflower', 'flower', 'ornamental'], minTemp: 15, maxTemp: 38, description: 'Tall, bright yellow flowers that follow the sun. Seeds are edible.' },
    { commonName: 'Lemon', scientificName: 'Citrus limon', family: 'Rutaceae', growingDays: 180, difficulty: 'MEDIUM', waterNeeds: 'MODERATE', sunlightNeeds: 'FULL_SUN', seasons: ['spring', 'summer', 'winter'], edible: true, tags: ['lemon', 'nimbu', 'citrus', 'fruit'], minTemp: 10, maxTemp: 40, description: 'Evergreen citrus tree producing tart yellow fruits year-round.' },
    { commonName: 'Basil', scientificName: 'Ocimum basilicum', family: 'Lamiaceae', growingDays: 35, difficulty: 'EASY', waterNeeds: 'MODERATE', sunlightNeeds: 'FULL_SUN', seasons: ['spring', 'summer'], edible: true, medicinal: true, tags: ['basil', 'tulsi', 'herb', 'medicinal'], minTemp: 15, maxTemp: 35, description: 'Aromatic herb used in cooking. Holy basil (Tulsi) is sacred in India.' },
    { commonName: 'Watermelon', scientificName: 'Citrullus lanatus', family: 'Cucurbitaceae', growingDays: 80, difficulty: 'MEDIUM', waterNeeds: 'HIGH', sunlightNeeds: 'FULL_SUN', seasons: ['summer'], edible: true, tags: ['watermelon', 'fruit', 'summer'], minTemp: 20, maxTemp: 40, description: 'Large, sweet summer fruit that needs plenty of space and water.' },
    { commonName: 'Fenugreek', scientificName: 'Trigonella foenum-graecum', family: 'Fabaceae', growingDays: 25, difficulty: 'EASY', waterNeeds: 'LOW', sunlightNeeds: 'FULL_SUN', seasons: ['winter', 'spring', 'fall'], edible: true, medicinal: true, tags: ['fenugreek', 'methi', 'herb', 'indian', 'medicinal'], minTemp: 10, maxTemp: 35, description: 'Also known as methi. Leaves used as vegetable, seeds as spice.' },
  ];

  const createdPlantIds: string[] = [];
  for (const p of plants) {
    const id = uuidv4();
    createdPlantIds.push(id);
    await prisma.plantSpecies.create({
      data: {
        id,
        ...p,
        isNative: true,
        baseYield: 3,
        tokensPerHarvest: 10,
        growthTimeHours: p.growingDays * 24,
        dataSource: 'manual',
      },
    });
  }

  console.log(`Created ${plants.length} plant species`);

  // ─── Demo Garden ────────────────────────────────────────────────────────
  const demoGardenId = uuidv4();
  await prisma.garden.create({
    data: {
      id: demoGardenId,
      name: 'Demo Garden',
      type: 'VIRTUAL',
      description: 'A demo virtual garden to explore GardenVerse features.',
      soilQuality: 65,
      irrigationLevel: 60,
      sunlightExposure: 70,
      gridWidth: 6,
      gridHeight: 6,
      irrigationType: 'DRIP',
      wateringMode: 'MANUAL',
      address: 'Bangalore, Karnataka',
      timezone: 'Asia/Kolkata',
      userId: demoId,
    },
  });

  console.log('Created demo garden for demo user');

  // ─── Demo Crops ─────────────────────────────────────────────────────────
  const now = new Date();

  // Crop 1: Tomato at (0,0) — in SPROUTING stage
  const crop1Id = uuidv4();
  const tomatoPlant = createdPlantIds[0];
  await prisma.crop.create({
    data: {
      id: crop1Id,
      name: 'Tomato',
      species: 'Solanum lycopersicum',
      status: 'SPROUTING',
      growthStage: 20,
      health: 85,
      hydration: 60,
      nutrientLevel: 50,
      plotX: 0,
      plotY: 0,
      careStreak: 2,
      totalCareCount: 3,
      estimatedHarvest: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      plantedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      speciesId: tomatoPlant,
      gardenId: demoGardenId,
      userId: demoId,
    },
  });

  // Crop 2: Chilli at (2, 1) — in GROWING stage
  const crop2Id = uuidv4();
  const chilliPlant = createdPlantIds[1];
  await prisma.crop.create({
    data: {
      id: crop2Id,
      name: 'Chilli',
      species: 'Capsicum annuum',
      status: 'GROWING',
      growthStage: 50,
      health: 90,
      hydration: 55,
      nutrientLevel: 45,
      plotX: 2,
      plotY: 1,
      careStreak: 5,
      totalCareCount: 6,
      estimatedHarvest: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000),
      plantedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
      speciesId: chilliPlant,
      gardenId: demoGardenId,
      userId: demoId,
    },
  });

  // Crop 3: Mint at (4, 3) — SEED just planted
  const crop3Id = uuidv4();
  const mintPlant = createdPlantIds[8];
  await prisma.crop.create({
    data: {
      id: crop3Id,
      name: 'Mint',
      species: 'Mentha spicata',
      status: 'SEED',
      growthStage: 5,
      health: 100,
      hydration: 70,
      nutrientLevel: 60,
      plotX: 4,
      plotY: 3,
      careStreak: 1,
      totalCareCount: 1,
      estimatedHarvest: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
      plantedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      speciesId: mintPlant,
      gardenId: demoGardenId,
      userId: demoId,
    },
  });

  console.log('Created 3 demo crops (Tomato, Chilli, Mint)');

  // ─── Feature Flags ──────────────────────────────────────────────────────
  const flags = [
    { name: 'virtual_garden_100x_speed', description: 'Enable 100x growth speed for virtual gardens', enabled: true },
    { name: 'ai_plant_scanner', description: 'Enable AI-powered plant disease detection', enabled: true },
    { name: 'marketplace', description: 'Enable peer-to-peer marketplace', enabled: true },
    { name: 'community_chat', description: 'Enable community chat features', enabled: true },
    { name: 'iot_integration', description: 'Enable IoT sensor integration', enabled: false },
    { name: 'gamification', description: 'Enable XP, levels, streaks', enabled: true },
  ];
  for (const f of flags) {
    await prisma.featureFlag.create({ data: f });
  }
  console.log(`Created ${flags.length} feature flags`);

  // ─── Marketplace Listings ─────────────────────────────────────────────────
  await prisma.marketplaceListing.create({
    data: {
      id: uuidv4(),
      title: 'Fresh Organic Tomatoes',
      description: 'Home-grown organic tomatoes from our virtual demo garden. Chemical-free and naturally ripened.',
      category: 'vegetables',
      price: 25,
      currency: 'GREEN_CREDITS',
      quantity: 10,
      status: 'ACTIVE',
      location: 'Bangalore, Karnataka',
      isLocal: true,
      sellerId: demoId,
    },
  });

  await prisma.marketplaceListing.create({
    data: {
      id: uuidv4(),
      title: 'Premium Mint Leaves',
      description: 'Freshly harvested mint (pudina) leaves, perfect for chutneys and teas.',
      category: 'herbs',
      price: 15,
      currency: 'GREEN_CREDITS',
      quantity: 20,
      status: 'ACTIVE',
      location: 'Bangalore, Karnataka',
      isLocal: true,
      sellerId: demoId,
    },
  });

  await prisma.marketplaceListing.create({
    data: {
      id: uuidv4(),
      title: 'Green Chilli Bundle',
      description: 'Spicy Indian green chillies, freshly picked. Great for tempering and curries.',
      category: 'vegetables',
      price: 20,
      currency: 'GREEN_CREDITS',
      quantity: 15,
      status: 'ACTIVE',
      location: 'Bangalore, Karnataka',
      isLocal: true,
      sellerId: demoId,
    },
  });

  console.log('Created 3 marketplace listings');

  // ─── Weather Records ──────────────────────────────────────────────────────
  const weatherRegions = [
    { region: 'IN-KA', temperature: 27, humidity: 65, rainfall: 8.2, windSpeed: 12, sunlightHours: 9, condition: 'PARTLY_CLOUDY' },
    { region: 'IN-MH', temperature: 32, humidity: 70, rainfall: 15.5, windSpeed: 8, sunlightHours: 7, condition: 'RAIN' },
    { region: 'IN-DL', temperature: 38, humidity: 35, rainfall: 0.5, windSpeed: 15, sunlightHours: 11, condition: 'CLEAR' },
    { region: 'IN-TN', temperature: 34, humidity: 75, rainfall: 12.0, windSpeed: 10, sunlightHours: 8, condition: 'CLOUDY' },
  ];

  for (const wr of weatherRegions) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 3);
    await prisma.weatherRecord.create({
      data: {
        region: wr.region,
        temperature: wr.temperature,
        humidity: wr.humidity,
        rainfall: wr.rainfall,
        windSpeed: wr.windSpeed,
        sunlightHours: wr.sunlightHours,
        condition: wr.condition,
        forecast: [
          { date: new Date(Date.now() + 86400000).toISOString().split('T')[0], temperature: { min: 22, max: 30 }, humidity: 60, condition: 'PARTLY_CLOUDY', precipitation: 10 },
          { date: new Date(Date.now() + 172800000).toISOString().split('T')[0], temperature: { min: 21, max: 29 }, humidity: 65, condition: 'CLOUDY', precipitation: 30 },
          { date: new Date(Date.now() + 259200000).toISOString().split('T')[0], temperature: { min: 23, max: 31 }, humidity: 55, condition: 'CLEAR', precipitation: 5 },
          { date: new Date(Date.now() + 345600000).toISOString().split('T')[0], temperature: { min: 20, max: 28 }, humidity: 70, condition: 'RAIN', precipitation: 60 },
          { date: new Date(Date.now() + 432000000).toISOString().split('T')[0], temperature: { min: 22, max: 30 }, humidity: 58, condition: 'PARTLY_CLOUDY', precipitation: 15 },
        ],
        expiresAt,
      },
    });
  }

  console.log(`Created ${weatherRegions.length} weather records`);

  // ─── Community Groups ─────────────────────────────────────────────────────
  const group1Id = uuidv4();
  await prisma.group.create({
    data: {
      id: group1Id,
      name: 'Bangalore Gardeners',
      description: 'A community for gardeners in and around Bangalore to share tips, seeds, and produce.',
      type: 'REGIONAL',
      region: 'IN-KA',
      isPrivate: false,
      members: {
        create: [
          { userId: demoId, role: 'MEMBER' },
        ],
      },
    },
  });

  const group2Id = uuidv4();
  await prisma.group.create({
    data: {
      id: group2Id,
      name: 'Organic Produce Exchange',
      description: 'Trade organic fruits, vegetables, and herbs with verified gardeners across India.',
      type: 'TRADE',
      region: null,
      isPrivate: false,
      members: {
        create: [
          { userId: adminId, role: 'ADMIN' },
          { userId: demoId, role: 'MEMBER' },
        ],
      },
    },
  });

  console.log('Created 2 community groups');

  // ─── Campaigns ────────────────────────────────────────────────────────────
  const campaign1Id = uuidv4();
  await prisma.campaign.create({
    data: {
      id: campaign1Id,
      name: 'Monsoon Planting Drive',
      type: 'seasonal',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      participants: 42,
      rewards: '500 XP, Rare Seed Pack',
      schedule: 'daily',
      description: 'Plant and nurture crops during the monsoon season to earn bonus rewards.',
    },
  });

  const campaign2Id = uuidv4();
  await prisma.campaign.create({
    data: {
      id: campaign2Id,
      name: 'Beginner Green Thumb',
      type: 'onboarding',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      participants: 128,
      rewards: '200 XP, Starter Bundle',
      schedule: 'onboarding',
      description: 'Complete onboarding steps to earn your first rewards as a new gardener.',
    },
  });

  // Campaign rewards
  await prisma.campaignReward.createMany({
    data: [
      { id: uuidv4(), name: 'Rare Tomato Seeds', type: 'item', value: 'Solanum lycopersicum - Golden variety', rarity: 'rare', cost: 50, campaignId: campaign1Id },
      { id: uuidv4(), name: 'Monsoon XP Boost', type: 'xp_boost', value: '2x XP for 24 hours', rarity: 'epic', cost: 100, campaignId: campaign1Id },
      { id: uuidv4(), name: 'Starter Fertilizer Pack', type: 'item', value: '5x Premium Fertilizer', rarity: 'common', cost: 10, campaignId: campaign2Id },
      { id: uuidv4(), name: 'Beginner Watering Can', type: 'item', value: 'Golden Watering Can (cosmetic)', rarity: 'uncommon', cost: 25, campaignId: campaign2Id },
    ],
  });

  console.log('Created 2 campaigns with 4 rewards');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
