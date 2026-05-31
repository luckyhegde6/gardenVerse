'use client'

import Link from 'next/link'
import { Sprout, Scan, CloudSun, MessageCircle, Cpu, Store, Shield, ArrowRight, Star, Leaf, Users, Sparkles } from 'lucide-react'
import { Button } from '@/components/Button'

const features = [
  { icon: Sprout, title: 'Virtual Gardens', description: 'Create and manage digital gardens with real plant lifecycles, growth simulation, and seasonal events.' },
  { icon: Scan, title: 'AI Plant Doctor', description: 'Snap a photo — AI diagnoses diseases and suggests treatments with our computer vision pipeline.' },
  { icon: CloudSun, title: 'Weather Intelligence', description: 'Real-time OpenWeatherMap integration, 7-day forecasts, and extreme weather alerts for your garden.' },
  { icon: MessageCircle, title: 'Community', description: 'Groups, encrypted chat, and local gardening networks via geohash-based proximity matching.' },
  { icon: Cpu, title: 'IoT Integration', description: 'Connect soil sensors for real-time moisture, temperature, and nutrient monitoring.' },
  { icon: Store, title: 'Marketplace', description: 'Trade produce with neighbors using escrow-protected blockchain transactions.' },
]

const stats = [
  { value: '10K+', label: 'Active Gardens' },
  { value: '50K+', label: 'Plants Identified' },
  { value: '5K+', label: 'Community Members' },
  { value: '95%', label: 'Satisfaction Rate' },
]

export default function LandingPage() {
  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 md:pt-28 md:pb-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Hybrid Agriculture Simulation Ecosystem
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-100 tracking-tight mb-6">
              Grow Together,
              <span className="text-emerald-400"> Sustainably</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              GardenVerse bridges the gap between digital gardening and real-world agriculture.
              Gamify sustainable farming, connect with local growers, and leverage AI to make
              expert agricultural knowledge accessible to everyone.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/onboarding">
                <Button variant="primary" size="lg" className="text-base px-8 py-3">
                  Get Started <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg" className="text-base px-8 py-3">
                  Admin Login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-emerald-400">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">Everything You Need</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              From virtual gardening to real-world IoT sensors, GardenVerse provides a complete ecosystem for modern agriculture enthusiasts.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(feature => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="card group hover:border-emerald-500/30 transition-colors">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 mb-4 group-hover:bg-emerald-500/20 transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
                <Star className="w-3.5 h-3.5" />
                Powered by AI
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">AI-Powered Plant Health</h2>
              <p className="text-slate-400 mb-6 leading-relaxed">
                Our computer vision pipeline can identify plant diseases, nutrient deficiencies, and pest
                infestations from a single photo. Get instant treatment recommendations and track recovery over time.
              </p>
              <ul className="space-y-3">
                {['Disease detection with 95%+ accuracy', 'Treatment recommendations from agricultural databases', 'Progress tracking with time-series photo analysis', 'Integration with IoT sensor data for precision diagnosis'].map(item => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                    <Leaf className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <Users className="w-6 h-6 text-emerald-400" />
                <h3 className="text-lg font-semibold text-slate-200">Join the Community</h3>
              </div>
              <p className="text-sm text-slate-400 mb-6">
                Connect with gardeners in your area, share tips, trade produce, and participate in seasonal events.
                Our geohash-based matching system helps you find nearby growers.
              </p>
              <div className="space-y-4">
                {['Local gardening groups based on your region', 'End-to-end encrypted messaging', 'Seasonal challenges and leaderboards', 'Sustainability scoring and rewards'].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24 border-t border-slate-800/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-100 mb-4">Ready to Start Growing?</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Join thousands of gardeners who are already using GardenVerse to grow smarter, connect locally, and make a difference.
          </p>
          <Link href="/onboarding">
            <Button variant="primary" size="lg" className="text-base px-10 py-3">
              Get Started <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
