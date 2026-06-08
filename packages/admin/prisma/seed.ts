import { PrismaClient, GardenType, CropStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { extraPlants } from './extra-plants';

// Ensure DATABASE_URL is set for Prisma
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://gardenverse:gardenverse123@localhost:5432/gardenverse?schema=public';
}

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
    'quest', 'campaignReward', 'campaign',
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
    ...extraPlants,
  ];

  const seenNames = new Set<string>();
  const uniquePlants = plants.filter((p: any) => {
    if (seenNames.has(p.scientificName)) return false;
    seenNames.add(p.scientificName);
    return true;
  });

  const createdPlantIds: string[] = [];
  for (const p of uniquePlants) {
    const id = uuidv4();
    createdPlantIds.push(id);
    const { baseYield: pBaseYield, tokensPerHarvest: pTokens, toxic: _toxic, ...rest } = p as any;
    await prisma.plantSpecies.create({
      data: {
        id,
        ...rest,
        isNative: true,
        baseYield: pBaseYield ?? 3,
        tokensPerHarvest: pTokens ?? 10,
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

  // Achievements
  const achievements = [
    { key: 'first_sprout', name: 'First Sprout', description: 'Plant your first crop', icon: 'seedling', category: 'gardening', maxProgress: 1, xpReward: 50, tokenReward: 0 },
    { key: 'green_thumb', name: 'Green Thumb', description: 'Plant 10 crops', icon: 'thumbsup', category: 'gardening', maxProgress: 10, xpReward: 200, tokenReward: 5 },
    { key: 'master_gardener', name: 'Master Gardener', description: 'Plant 50 crops across 10+ species', icon: 'farmer', category: 'gardening', maxProgress: 50, xpReward: 1000, tokenReward: 25 },
    { key: 'water_warrior', name: 'Water Warrior', description: 'Water crops 20 times', icon: 'droplet', category: 'care', maxProgress: 20, xpReward: 100, tokenReward: 3 },
    { key: 'harvest_hero', name: 'Harvest Hero', description: 'Harvest 5 mature crops', icon: 'wheat', category: 'harvest', maxProgress: 5, xpReward: 300, tokenReward: 10 },
    { key: 'market_mogul', name: 'Market Mogul', description: 'Create 5 marketplace listings', icon: 'store', category: 'commerce', maxProgress: 5, xpReward: 250, tokenReward: 8 },
    { key: 'community_builder', name: 'Community Builder', description: 'Join 3 community groups', icon: 'people', category: 'social', maxProgress: 3, xpReward: 150, tokenReward: 5 },
    { key: 'streak_keeper', name: 'Streak Keeper', description: 'Maintain a 7-day care streak', icon: 'fire', category: 'engagement', maxProgress: 7, xpReward: 500, tokenReward: 15 },
    { key: 'ai_detective', name: 'AI Detective', description: 'Use the AI scanner 5 times', icon: 'magnifying-glass', category: 'ai', maxProgress: 5, xpReward: 200, tokenReward: 5 },
    { key: 'eco_warrior', name: 'Eco Warrior', description: 'Reach sustainability score of 80', icon: 'earth', category: 'sustainability', maxProgress: 80, xpReward: 750, tokenReward: 20 },
    { key: 'species_collector', name: 'Species Collector', description: 'Discover 15 plant species', icon: 'book', category: 'collection', maxProgress: 15, xpReward: 400, tokenReward: 10 },
    { key: 'daily_claimer', name: 'Daily Claimer', description: 'Claim a daily reward', icon: 'gift', category: 'engagement', maxProgress: 1, xpReward: 25, tokenReward: 1 },
  ];
  for (const a of achievements) {
    await prisma.achievement.create({ data: a });
  }
  console.log(`Created ${achievements.length} achievements`);

  // Quests
  const quests = [
    { key: 'plant_3_tomato', title: 'Plant 3 Tomato Crops', description: 'Plant tomato seeds in your garden', category: 'DAILY', type: 'PLANT', targetCount: 3, xpReward: 100, creditReward: 0, icon: 'seedling', sortOrder: 1 },
    { key: 'water_10_crops', title: 'Water 10 Crops', description: 'Keep your garden hydrated', category: 'DAILY', type: 'WATER', targetCount: 10, xpReward: 50, creditReward: 0, icon: 'droplet', sortOrder: 2 },
    { key: 'harvest_5_crops', title: 'Harvest 5 Crops', description: 'Reap what you have sown', category: 'WEEKLY', type: 'HARVEST', targetCount: 5, xpReward: 200, creditReward: 50, icon: 'wheat', sortOrder: 3 },
    { key: 'plant_5_species', title: 'Plant Any 5 Species', description: 'Diversify your garden', category: 'WEEKLY', type: 'PLANT_SPECIES', targetCount: 5, xpReward: 300, creditReward: 25, icon: 'leaf', sortOrder: 4 },
    { key: 'streak_3_days', title: 'Maintain 3-day Streak', description: 'Care for your garden 3 days in a row', category: 'WEEKLY', type: 'STREAK', targetCount: 3, xpReward: 150, creditReward: 25, icon: 'fire', sortOrder: 5 },
    { key: 'ai_scan_1', title: 'Scan a Diseased Plant', description: 'Use AI scanner to detect plant disease', category: 'DAILY', type: 'AI_SCAN', targetCount: 1, xpReward: 75, creditReward: 0, icon: 'magnifying-glass', sortOrder: 6 },
    { key: 'earn_500_xp', title: 'Earn 500 XP', description: 'Level up through gardening', category: 'WEEKLY', type: 'EARN_XP', targetCount: 500, xpReward: 0, creditReward: 100, icon: 'star', sortOrder: 7 },
    { key: 'fertilize_5_crops', title: 'Fertilize 5 Crops', description: 'Give your crops a nutrient boost', category: 'DAILY', type: 'FERTILIZE', targetCount: 5, xpReward: 80, creditReward: 0, icon: 'flask', sortOrder: 8 },
  ];
  for (const q of quests) {
    await prisma.quest.create({ data: q });
  }
  console.log(`Created ${quests.length} quests`);

  // Additional Users with Gardens
  const userData = [
    { email: 'priya@gardenverse.com', username: 'priya_grows', displayName: 'Priya Sharma', region: 'IN-MH', geohash: 'te7u3', level: 12, xp: 4800 },
    { email: 'raj@gardenverse.com', username: 'raj_farms', displayName: 'Raj Patel', region: 'IN-GJ', geohash: 'tsk5r', level: 8, xp: 2800 },
    { email: 'ananya@gardenverse.com', username: 'ananya_garden', displayName: 'Ananya Iyer', region: 'IN-TN', geohash: 'dtyk7', level: 15, xp: 7200 },
    { email: 'karan@gardenverse.com', username: 'karan_green', displayName: 'Karan Singh', region: 'IN-RJ', geohash: 'thrc4', level: 6, xp: 1500 },
    { email: 'meera@gardenverse.com', username: 'meera_plants', displayName: 'Meera Nair', region: 'IN-KL', geohash: 'tj4k8', level: 20, xp: 12000 },
  ];
  const cities: Record<string, string> = { 'IN-MH': 'Mumbai', 'IN-GJ': 'Ahmedabad', 'IN-TN': 'Chennai', 'IN-RJ': 'Jaipur', 'IN-KL': 'Kochi' };
  const gTypes: GardenType[] = ['VIRTUAL', 'REAL', 'HYBRID'];
  const irrTypes = ['DRIP', 'SPRINKLER', 'MANUAL'];
  const cStatuses: CropStatus[] = ['SEED', 'SPROUTING', 'GROWING', 'MATURE'];

  for (const u of userData) {
    const uid = uuidv4();
    await prisma.user.create({
      data: {
        id: uid, email: u.email, username: u.username, displayName: u.displayName,
        passwordHash: hash, role: 'USER', isVerified: true, isOnboarded: true,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`,
        bio: `${u.displayName} - passionate gardener from ${u.region}.`,
        geohash: u.geohash, region: u.region, level: u.level, experience: u.xp,
        greenCredits: u.level * 100, ecoPoints: u.level * 50,
        sustainabilityScore: 30 + Math.random() * 50, trustScore: 40 + Math.random() * 40,
        marketplaceReliability: 20 + Math.random() * 60, communityStanding: 30 + Math.random() * 50,
        inviteCount: Math.floor(Math.random() * 5), currentStreak: Math.floor(Math.random() * 14),
        longestStreak: 14 + Math.floor(Math.random() * 30), lastActiveAt: new Date(),
      },
    });
    const gid = uuidv4();
    await prisma.garden.create({
      data: {
        id: gid, name: `${u.displayName.split(' ')[0]}'s Garden`,
        type: gTypes[Math.floor(Math.random() * gTypes.length)],
        description: `${u.displayName}'s personal garden space.`,
        soilQuality: 40 + Math.floor(Math.random() * 50),
        irrigationLevel: 30 + Math.floor(Math.random() * 60),
        sunlightExposure: 40 + Math.floor(Math.random() * 50),
        gridWidth: 6, gridHeight: 6,
        irrigationType: irrTypes[Math.floor(Math.random() * irrTypes.length)],
        wateringMode: 'MANUAL', address: `${cities[u.region] || 'India'}`,
        timezone: 'Asia/Kolkata', userId: uid,
      },
    });
    const cropCount = 2 + Math.floor(Math.random() * 3);
    const usedPos = new Set();
    for (let i = 0; i < cropCount; i++) {
      let px, py, key;
      do { px = Math.floor(Math.random() * 6); py = Math.floor(Math.random() * 6); key = `${px},${py}`; } while (usedPos.has(key));
      usedPos.add(key);
      const pIdx = Math.floor(Math.random() * Math.min(createdPlantIds.length, 20));
      await prisma.crop.create({
        data: {
          id: uuidv4(), name: uniquePlants[pIdx].commonName, species: uniquePlants[pIdx].scientificName,
          status: cStatuses[Math.floor(Math.random() * cStatuses.length)],
          growthStage: Math.floor(Math.random() * 100),
          health: 40 + Math.floor(Math.random() * 60),
          hydration: 20 + Math.floor(Math.random() * 70),
          nutrientLevel: 20 + Math.floor(Math.random() * 70),
          plotX: px, plotY: py,
          careStreak: Math.floor(Math.random() * 10),
          totalCareCount: Math.floor(Math.random() * 20),
          estimatedHarvest: new Date(now.getTime() + Math.random() * 14 * 86400000),
          plantedAt: new Date(now.getTime() - Math.random() * 10 * 86400000),
          speciesId: createdPlantIds[pIdx], gardenId: gid, userId: uid,
        },
      });
    }
  }
  console.log(`Created ${userData.length} additional users with gardens and crops`);

  // AI Scans
  const scanData = [
    { userId: demoId, imageUrl: '/uploads/scans/tomato-blight.jpg', plantName: 'Tomato', species: 'Solanum lycopersicum', healthScore: 45, diseases: JSON.stringify([{ name: 'Early Blight', confidence: 0.87 }]), recommendations: JSON.stringify(['Remove affected leaves', 'Apply copper-based fungicide']) },
    { userId: demoId, imageUrl: '/uploads/scans/chilli-healthy.jpg', plantName: 'Chilli', species: 'Capsicum annuum', healthScore: 92, diseases: JSON.stringify([]), recommendations: JSON.stringify(['Plant is healthy', 'Continue current care']) },
    { userId: adminId, imageUrl: '/uploads/scans/mint-rust.jpg', plantName: 'Mint', species: 'Mentha spicata', healthScore: 60, diseases: JSON.stringify([{ name: 'Mint Rust', confidence: 0.78 }]), recommendations: JSON.stringify(['Remove infected stems', 'Apply neem oil spray']) },
  ];
  for (const s of scanData) { await prisma.aiScan.create({ data: s }); }
  console.log(`Created ${scanData.length} AI scan records`);

  // Notifications
  const notifData = [
    { userId: demoId, type: 'system', title: 'Welcome to GardenVerse!', body: 'Start your gardening journey by planting your first crop.', isRead: false },
    { userId: demoId, type: 'growth', title: 'Tomato is sprouting!', body: 'Your tomato crop has entered the sprouting stage.', isRead: false },
    { userId: demoId, type: 'weather', title: 'Rain expected tomorrow', body: 'Heavy rain forecast in Bangalore.', isRead: true },
    { userId: demoId, type: 'achievement', title: 'Achievement: First Sprout', body: 'You planted your first crop. +50 XP!', isRead: true },
    { userId: demoId, type: 'marketplace', title: 'Your mint listing got a view', body: 'Someone is interested in your listing.', isRead: false },
  ];
  for (const n of notifData) { await prisma.notification.create({ data: n }); }
  console.log(`Created ${notifData.length} notifications`);

  // Invites
  const inviteData = [
    { code: 'GARDEN2024', maxUses: 100, useCount: 12, isActive: true, expiresAt: new Date(Date.now() + 30 * 86400000), createdById: superadminId },
    { code: 'WELCOME50', maxUses: 50, useCount: 3, isActive: true, expiresAt: new Date(Date.now() + 60 * 86400000), createdById: adminId },
    { code: 'DEMO-FRIEND', maxUses: 10, useCount: 0, isActive: true, createdById: demoId },
  ];
  for (const inv of inviteData) { await prisma.invite.create({ data: inv }); }
  console.log(`Created ${inviteData.length} invite codes`);

  console.log('');
  console.log('=== SEED COMPLETE - GardenVerse database populated! ===');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
