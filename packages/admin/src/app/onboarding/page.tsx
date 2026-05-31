'use client'

import { useState } from 'react'
import {
  Sprout,
  GraduationCap,
  CheckCircle2,
  Circle,
  ArrowRight,
  Scan,
  CloudSun,
  MessageCircle,
  Cpu,
  ChevronRight,
  ChevronLeft,
  Star,
  Target,
  Rocket,
  Globe,
} from 'lucide-react'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { cn } from '@/lib/utils'

// ─── Step data ──────────────────────────────────────────────────────────────

interface Step {
  number: number
  icon: string
  title: string
  description: string
  duration: string
  tips: string[]
}

const steps: Step[] = [
  {
    number: 1,
    icon: '🌱',
    title: 'Create Your Garden',
    description:
      'Start by creating a digital garden. Choose a location, set your growing zone, and define the size of your plot. You can create multiple gardens for different purposes.',
    duration: '~2 minutes',
    tips: [
      'Start with a small garden (4x4 plots) to learn the basics',
      'Choose a sunny location for best crop growth',
      'You can always expand your garden later',
    ],
  },
  {
    number: 2,
    icon: '🌿',
    title: 'Plant Crops',
    description:
      'Browse the plant catalog and select crops for your garden. Each plant has unique growing requirements, harvest times, and climate preferences.',
    duration: '~3 minutes',
    tips: [
      'Begin with fast-growing crops like lettuce or radishes',
      'Check each plant\'s season and climate requirements',
      'Plant complementary crops together for better yields',
    ],
  },
  {
    number: 3,
    icon: '💧',
    title: 'Water & Fertilize',
    description:
      'Keep your crops healthy by watering and fertilizing them regularly. Monitor soil moisture, apply nutrients, and protect plants from pests and diseases.',
    duration: '~1 minute daily',
    tips: [
      'Water early in the morning for best absorption',
      'Use compost for organic fertilizer bonus',
      'Watch for wilting leaves — they signal water stress',
    ],
  },
  {
    number: 4,
    icon: '🌾',
    title: 'Harvest Your Crops',
    description:
      'When crops reach maturity, harvest them at the peak of ripeness for maximum yield and quality. Different crops have different harvest indicators.',
    duration: '~2 minutes',
    tips: [
      'Harvest in dry weather for better storage quality',
      'Use the AI Scanner to check crop health before harvesting',
      'Some crops regrow after harvest — check the plant details',
    ],
  },
  {
    number: 5,
    icon: '🏪',
    title: 'Sell on Marketplace',
    description:
      'List your harvested produce on the marketplace. Set prices, trade with other gardeners, and earn GardenVerse credits and XP.',
    duration: '~3 minutes',
    tips: [
      'Price competitively by checking current market rates',
      'Bundle similar items for bulk discounts',
      'Premium quality produce sells for 2x-3x the base price',
    ],
  },
]

// ─── Feature highlight data ──────────────────────────────────────────────────

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  color: string
}

const features: Feature[] = [
  {
    icon: <Scan className="w-6 h-6" />,
    title: 'AI Plant Scanner',
    description:
      'Snap a photo of any plant and our AI identifies diseases, pests, and nutrient deficiencies with 93%+ accuracy.',
    color: 'from-sky-500/20 to-sky-500/5',
  },
  {
    icon: <CloudSun className="w-6 h-6" />,
    title: 'Weather Intelligence',
    description:
      'Real-time weather data from OpenWeatherMap helps you plan planting, watering, and harvesting around the forecast.',
    color: 'from-amber-500/20 to-amber-500/5',
  },
  {
    icon: <MessageCircle className="w-6 h-6" />,
    title: 'Community & Groups',
    description:
      'Connect with nearby gardeners, join growing groups, share tips, and trade produce in your local area.',
    color: 'from-purple-500/20 to-purple-500/5',
  },
  {
    icon: <Cpu className="w-6 h-6" />,
    title: 'IoT Sensor Integration',
    description:
      'Connect soil moisture, temperature, and light sensors for real-time garden monitoring and automated alerts.',
    color: 'from-emerald-500/20 to-emerald-500/5',
  },
]

// ─── Checklist data ──────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string
  label: string
  completed: boolean
}

const initialChecklist: ChecklistItem[] = [
  { id: 'c1', label: 'Create your first garden', completed: false },
  { id: 'c2', label: 'Plant at least 3 different crops', completed: false },
  { id: 'c3', label: 'Water your crops for 3 consecutive days', completed: false },
  { id: 'c4', label: 'Harvest your first crop', completed: false },
  { id: 'c5', label: 'Complete your first marketplace trade', completed: false },
  { id: 'c6', label: 'Scan a plant with AI Scanner', completed: false },
  { id: 'c7', label: 'Join a community group', completed: false },
  { id: 'c8', label: 'Connect a weather station', completed: false },
]

// ─── Page component ──────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [activeStep, setActiveStep] = useState(0)
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist)
  const [showAllSteps, setShowAllSteps] = useState(false)

  const completedCount = checklist.filter(i => i.completed).length
  const totalCount = checklist.length
  const progressPercent = Math.round((completedCount / totalCount) * 100)

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev =>
      prev.map(item =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    )
  }

  const currentStep = steps[activeStep]

  return (
    <div className="space-y-8">
      {/* ── Header Section ────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-admin-400" />
            <h1 className="text-2xl font-bold text-slate-100">Getting Started</h1>
          </div>
          <p className="text-sm text-slate-400 max-w-2xl">
            Welcome to GardenVerse! Follow this guide to set up your garden, grow your first crops,
            and start trading on the marketplace. Complete the checklist to track your progress.
          </p>
        </div>
        <Badge variant="info" className="text-xs">
          v1.0
        </Badge>
      </div>

      {/* ── Welcome Hero Card ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800/60 bg-gradient-to-br from-admin-950/60 via-slate-900 to-slate-950 p-8">
        {/* Background decoration */}
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-admin-500/5 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl" />

        <div className="relative flex flex-col lg:flex-row items-start lg:items-center gap-6">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-admin-500/20 shrink-0">
            <Sprout className="w-8 h-8 text-admin-400" />
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">
              Welcome to GardenVerse 🌱
            </h2>
            <p className="text-slate-400 max-w-2xl leading-relaxed">
              GardenVerse is a hybrid agriculture simulation ecosystem where you can create
              virtual gardens, grow real plant lifecycles, diagnose crops with AI, connect with
              fellow gardeners, and trade produce on the marketplace. Whether you are a seasoned
              farmer or a curious newbie, there is something here for you.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Badge variant="success" dot>
                26+ Crops Available
              </Badge>
              <Badge variant="info" dot>
                AI-Powered Analysis
              </Badge>
              <Badge variant="warning" dot>
                Multiplayer Marketplace
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* ── Progress & Checklist Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Card */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-admin-400" />
            <h3 className="text-sm font-medium text-slate-300">Your Progress</h3>
          </div>
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-3xl font-bold text-slate-100">{progressPercent}%</span>
            <span className="text-sm text-slate-500">complete</span>
          </div>
          <div className="h-2 rounded-full bg-slate-800 overflow-hidden mb-1">
            <div
              className="h-full rounded-full bg-gradient-to-r from-admin-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {completedCount} of {totalCount} tasks done
          </p>
        </div>

        {/* XP & Stats */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-medium text-slate-300">Estimated Rewards</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-0.5">XP from checklist</p>
              <p className="text-xl font-bold text-amber-400">+1,200 XP</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Credits earned</p>
              <p className="text-xl font-bold text-emerald-400">+500 GC</p>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Rocket className="w-5 h-5 text-sky-400" />
            <h3 className="text-sm font-medium text-slate-300">Quick Links</h3>
          </div>
          <div className="space-y-2">
            <a
              href="/garden"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
            >
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <Sprout className="w-4 h-4 text-admin-400" />
                My Gardens
              </span>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </a>
            <a
              href="/marketplace"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
            >
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <Globe className="w-4 h-4 text-sky-400" />
                Marketplace
              </span>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </a>
            <a
              href="/ai-scanner"
              className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors group"
            >
              <span className="flex items-center gap-2 text-sm text-slate-300">
                <Scan className="w-4 h-4 text-purple-400" />
                AI Scanner
              </span>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Step-by-Step Guide ────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-admin-400" />
            <h3 className="card-title">Step-by-Step Guide</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllSteps(!showAllSteps)}
            >
              {showAllSteps ? 'Collapse' : 'Show All Steps'}
            </Button>
          </div>
        </div>

        {/* Step navigation dots */}
        <div className="flex items-center gap-2 mb-6">
          {steps.map((step, index) => (
            <button
              key={step.number}
              onClick={() => setActiveStep(index)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                index === activeStep
                  ? 'bg-admin-500/15 text-admin-400'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
              )}
            >
              <span className="text-sm">{step.icon}</span>
              {!showAllSteps && index === activeStep && (
                <span className="hidden sm:inline">Step {step.number}</span>
              )}
              {showAllSteps && <span className="hidden sm:inline">Step {step.number}</span>}
            </button>
          ))}
        </div>

        {showAllSteps ? (
          /* ── All steps expanded ───────────────────────────────────── */
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className={cn(
                  'rounded-xl border p-5 transition-all',
                  index === activeStep
                    ? 'border-admin-500/30 bg-admin-500/5'
                    : 'border-slate-800/60 bg-slate-900/30'
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      'flex items-center justify-center w-12 h-12 rounded-xl text-2xl shrink-0',
                      index === activeStep
                        ? 'bg-admin-500/20 ring-1 ring-admin-500/30'
                        : 'bg-slate-800/50'
                    )}
                  >
                    {step.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-base font-semibold text-slate-100">
                        Step {step.number}: {step.title}
                      </h4>
                      <Badge variant="default">{step.duration}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">{step.description}</p>
                    <div className="space-y-1">
                      {step.tips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                          <span className="text-emerald-400 mt-0.5">✦</span>
                          <span>{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Single step view with navigation ─────────────────────── */
          <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-6">
            <div className="flex items-start gap-5">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-admin-500/15 ring-1 ring-admin-500/20 text-3xl shrink-0">
                {currentStep.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h4 className="text-lg font-semibold text-slate-100">
                    Step {currentStep.number}: {currentStep.title}
                  </h4>
                  <Badge variant="default">{currentStep.duration}</Badge>
                </div>
                <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                  {currentStep.description}
                </p>
                <div className="space-y-1.5">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Pro Tips
                  </p>
                  {currentStep.tips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="text-emerald-400 mt-0.5 shrink-0">✦</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step navigation controls */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/60">
          <Button
            variant="ghost"
            size="sm"
            disabled={activeStep === 0}
            onClick={() => setActiveStep(a => Math.max(0, a - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          <span className="text-xs text-slate-500">
            Step {activeStep + 1} of {steps.length}
          </span>
          <Button
            variant={activeStep === steps.length - 1 ? 'primary' : 'secondary'}
            size="sm"
            onClick={() =>
              activeStep < steps.length - 1
                ? setActiveStep(a => a + 1)
                : setActiveStep(0)
            }
          >
            {activeStep === steps.length - 1 ? (
              <>Start Over</>
            ) : (
              <>
                Next Step
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Getting Started Checklist ────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-admin-400" />
            <h3 className="card-title">Getting Started Checklist</h3>
          </div>
          <Badge variant={progressPercent === 100 ? 'success' : 'info'}>
            {completedCount}/{totalCount}
          </Badge>
        </div>

        <div className="space-y-1">
          {checklist.map(item => (
            <button
              key={item.id}
              onClick={() => toggleChecklistItem(item.id)}
              className={cn(
                'flex items-center gap-3 w-full p-3 rounded-lg text-left transition-all',
                item.completed
                  ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                  : 'hover:bg-slate-800/50'
              )}
            >
              {item.completed ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-slate-600 shrink-0" />
              )}
              <span
                className={cn(
                  'text-sm',
                  item.completed
                    ? 'text-emerald-400 line-through'
                    : 'text-slate-300'
                )}
              >
                {item.label}
              </span>
            </button>
          ))}
        </div>

        {progressPercent === 100 && (
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-admin-500/10 to-emerald-500/10 border border-admin-500/20 text-center">
            <p className="text-lg font-semibold text-admin-400 mb-1">
              🎉 Congratulations!
            </p>
            <p className="text-sm text-slate-400">
              You have completed all onboarding tasks. You are now ready to explore everything
              GardenVerse has to offer!
            </p>
          </div>
        )}
      </div>

      {/* ── Feature Highlights ───────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Rocket className="w-5 h-5 text-admin-400" />
          <h2 className="text-lg font-semibold text-slate-100">Feature Highlights</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className={cn(
                'rounded-xl border border-slate-800/60 bg-gradient-to-br p-6 transition-all hover:border-slate-700/80',
                feature.color
              )}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/60 text-admin-400 shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Call to Action ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800/60 bg-gradient-to-br from-slate-900 via-admin-950/30 to-slate-900 p-8 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.08)_0%,transparent_70%)]" />
        <div className="relative space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Sprout className="w-8 h-8 text-admin-400" />
            <h2 className="text-2xl font-bold text-slate-100">Ready to Start Growing?</h2>
          </div>
          <p className="text-slate-400 max-w-lg mx-auto">
            Head over to your garden to plant your first crop, or explore the marketplace to see
            what other gardeners are trading.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <a href="/garden">
              <Button variant="primary" size="lg">
                <Sprout className="w-4 h-4" />
                Go to My Garden
              </Button>
            </a>
            <a href="/marketplace">
              <Button variant="secondary" size="lg">
                <Globe className="w-4 h-4" />
                Browse Marketplace
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
