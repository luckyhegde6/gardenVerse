'use client'

import { Sprout, Users, Shield, Globe } from 'lucide-react'

const values = [
  { icon: Sprout, title: 'Sustainability', description: 'We believe in promoting sustainable farming practices through education, gamification, and community support.' },
  { icon: Users, title: 'Community', description: 'Gardening is better together. We connect local growers to share knowledge, resources, and produce.' },
  { icon: Shield, title: 'Trust & Safety', description: 'End-to-end encryption, secure transactions, and verified identities ensure a safe platform for everyone.' },
  { icon: Globe, title: 'Global Access', description: 'Expert agricultural knowledge should be accessible to everyone, regardless of location or experience level.' },
]

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
          <Sprout className="w-3.5 h-3.5" />
          About GardenVerse
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-4">Our Mission</h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          GardenVerse bridges the gap between digital gardening and real-world agriculture.
          We gamify sustainable farming, connect local growers, and leverage AI to make
          expert agricultural knowledge accessible to everyone.
        </p>
      </div>

      <div className="space-y-16">
        <section>
          <h2 className="text-2xl font-bold text-slate-200 mb-6">Our Story</h2>
          <div className="prose prose-invert max-w-none">
            <p className="text-slate-400 leading-relaxed mb-4">
              GardenVerse was born from a simple idea: what if we could combine the joy of digital gardening
              with real-world agricultural impact? Starting as a hackathon project, it has grown into a
              comprehensive platform that serves gardeners, farmers, and agriculture enthusiasts worldwide.
            </p>
            <p className="text-slate-400 leading-relaxed mb-4">
              Our platform integrates virtual garden simulation with AI-powered plant diagnosis,
              IoT sensor connectivity, blockchain-escrowed marketplace transactions, and community
              features that connect growers based on geographic proximity.
            </p>
            <p className="text-slate-400 leading-relaxed">
              Today, GardenVerse powers thousands of virtual gardens, has identified over 50,000 plants
              through our AI vision pipeline, and connects a growing community of agriculture enthusiasts
              across the globe.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-200 mb-6">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map(value => {
              const Icon = value.icon
              return (
                <div key={value.title} className="card">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-200 mb-2">{value.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{value.description}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="text-center py-12 border-t border-slate-800/60">
          <h2 className="text-2xl font-bold text-slate-200 mb-4">Technology Stack</h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto">
            Built with modern technology for scalability, security, and performance.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {['NestJS', 'Next.js', 'React Native', 'PostgreSQL', 'Redis', 'Prisma', 'FastAPI', 'OpenCV', 'Docker', 'WebSocket', 'MQTT', 'BullMQ'].map(tech => (
              <span key={tech} className="px-3 py-1.5 rounded-lg bg-slate-800/50 text-sm text-slate-300 border border-slate-700/50">
                {tech}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}


