import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { requireAuth, success, serverError } from '@/lib/middleware/auth'

interface EncouragementTip {
  category: string
  title: string
  content: string
  icon: string
}

const DAILY_TIPS: EncouragementTip[] = [
  {
    category: 'soil_health',
    title: 'Check your soil pH',
    content: 'Healthy soil is the foundation of a thriving garden. Test your soil pH weekly and amend with lime (to raise) or sulfur (to lower) as needed for your specific crops.',
    icon: '🧪',
  },
  {
    category: 'seasonal_planting',
    title: 'Seasonal sowing guide',
    content: 'Plant leafy greens and root vegetables this season. They thrive in the current conditions and will give you a bountiful harvest within 6-8 weeks.',
    icon: '📅',
  },
  {
    category: 'water_conservation',
    title: 'Smart watering tips',
    content: 'Water deeply but less frequently to encourage deep root growth. Early morning watering reduces evaporation and helps prevent fungal diseases.',
    icon: '💧',
  },
  {
    category: 'pest_alerts',
    title: 'Natural pest control',
    content: 'Introduce beneficial insects like ladybugs and lacewings to control aphids naturally. Companion planting with marigolds and basil also deters common pests.',
    icon: '🐞',
  },
  {
    category: 'companion_planting',
    title: 'Perfect plant pairings',
    content: 'Tomatoes grow excellently alongside basil, which improves their flavor and repels hornworms. Avoid planting tomatoes near fennel or potatoes.',
    icon: '🌻',
  },
  {
    category: 'soil_health',
    title: 'Compost your kitchen waste',
    content: 'Start a compost pile with vegetable scraps, eggshells, and coffee grounds. This enriches your soil naturally and reduces landfill waste.',
    icon: '♻️',
  },
  {
    category: 'seasonal_planting',
    title: 'Prepare for the next season',
    content: 'Clear spent crops and add organic matter to garden beds. Cover crops like clover or winter rye protect and enrich soil during the off-season.',
    icon: '🌾',
  },
  {
    category: 'water_conservation',
    title: 'Mulch to retain moisture',
    content: 'Apply a 2-3 inch layer of organic mulch around your plants. This reduces water evaporation, suppresses weeds, and regulates soil temperature.',
    icon: '🌿',
  },
  {
    category: 'pest_alerts',
    title: 'Monitor for early signs',
    content: 'Check the undersides of leaves weekly for eggs or early pest activity. Early intervention with neem oil or insecticidal soap prevents major outbreaks.',
    icon: '🔍',
  },
  {
    category: 'companion_planting',
    title: 'Three Sisters planting',
    content: 'Try the classic Native American companion planting method: corn (support), beans (nitrogen fixer), and squash (ground cover) grow synergistically together.',
    icon: '🌽',
  },
  {
    category: 'soil_health',
    title: 'Rotate your crops',
    content: 'Avoid planting the same crop family in the same spot year after year. Crop rotation prevents nutrient depletion and reduces soil-borne disease buildup.',
    icon: '🔄',
  },
  {
    category: 'seasonal_planting',
    title: 'Extend your growing season',
    content: 'Use row covers, cold frames, or cloches to protect plants from early frosts and extend your harvest by several weeks in each direction.',
    icon: '🛡️',
  },
  {
    category: 'water_conservation',
    title: 'Install a rain barrel',
    content: 'Collect rainwater from your roof gutters. Rainwater is better for plants than tap water (no chlorine) and reduces your water bill during dry spells.',
    icon: '🛢️',
  },
  {
    category: 'pest_alerts',
    title: 'Attract beneficial wildlife',
    content: 'Install a bird bath and plant native flowers to attract birds, bees, and butterflies. These natural allies pollinate crops and control pest populations.',
    icon: '🦋',
  },
  {
    category: 'companion_planting',
    title: 'Herb garden companions',
    content: 'Plant dill, fennel, and cilantro near your vegetable beds. Their flowers attract parasitic wasps that naturally control caterpillars and other leaf-eaters.',
    icon: '🌿',
  },
]

export async function GET(request: NextRequest) {
  const auth = requireAuth(request)
  if ('error' in auth) return auth.error

  try {
    const userId = auth.payload.userId

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        isRealGardener: true,
        gardenerBadge: true,
        region: true,
        experience: true,
        level: true,
      },
    })

    if (!user) {
      return success({
        category: 'general',
        title: 'Welcome to GardenVerse',
        content: 'Start your gardening journey by creating a garden and planting your first seeds!',
        icon: '🌱',
        tipNumber: 0,
      })
    }

    const dayOfYear = getDayOfYear()
    const tipIndex = (dayOfYear + userId.charCodeAt(0) + userId.length) % DAILY_TIPS.length
    const todayTip = DAILY_TIPS[tipIndex]

    let personalizedContent = todayTip.content
    if (user.region) {
      const regionTips: Record<string, string> = {
        'bangalore': ' In Bangalore\'s mild climate, your plants benefit from the moderate temperatures year-round.',
        'mumbai': ' Mumbai\'s humid coastal conditions mean you should watch for fungal issues on leaves.',
        'delhi': ' Delhi\'s extreme summers require extra shade and watering for your plants.',
        'pune': ' Pune\'s pleasant weather is ideal for growing a wide variety of vegetables.',
        'chennai': ' Chennai\'s warm climate is perfect for tropical plants year-round.',
      }
      const regionKey = user.region.toLowerCase()
      for (const [key, tip] of Object.entries(regionTips)) {
        if (regionKey.includes(key)) {
          personalizedContent += tip
          break
        }
      }
    }

    return success({
      ...todayTip,
      content: personalizedContent,
      tipNumber: tipIndex + 1,
      totalTips: DAILY_TIPS.length,
      isRealGardener: user.isRealGardener,
      badge: user.gardenerBadge || null,
    })
  } catch (error) {
    return serverError(error)
  }
}

function getDayOfYear(): number {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const diff = now.getTime() - start.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}
