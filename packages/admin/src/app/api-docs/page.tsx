'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ChevronRight,
  Shield,
  Globe,
  Lock,
  BookOpen,
  Route,
} from 'lucide-react'
import { cn } from '@/lib/utils'

/* -------------------------------------------------------------------------- */
/*  Data                                                                      */
/* -------------------------------------------------------------------------- */

interface RouteInfo {
  path: string
  methods: string[]
  auth: 'public' | 'auth' | 'role'
  description: string
}

interface ModuleInfo {
  name: string
  label: string
  icon: string
  description: string
  routes: RouteInfo[]
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  PUT: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  PATCH: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const AUTH_ICONS: Record<string, { icon: string; label: string }> = {
  public: { icon: '🌐', label: 'Public' },
  auth: { icon: '🔒', label: 'Auth Required' },
  role: { icon: '🔒', label: 'Admin / Super Admin' },
}

const AUTH_COLORS: Record<string, string> = {
  public: 'bg-slate-700/50 text-slate-300 border-slate-600/30',
  auth: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  role: 'bg-admin-500/15 text-admin-400 border-admin-500/20',
}

const MODULES: ModuleInfo[] = [
  {
    name: 'auth',
    label: 'Authentication',
    icon: '🔐',
    description: 'User authentication, registration, password management, and OTP verification',
    routes: [
      { path: 'auth/login', methods: ['POST'], auth: 'public', description: 'Authenticate user with email and password, returns JWT tokens' },
      { path: 'auth/register', methods: ['POST'], auth: 'public', description: 'Create a new user account' },
      { path: 'auth/logout', methods: ['POST'], auth: 'public', description: 'Invalidate current session and refresh token' },
      { path: 'auth/refresh', methods: ['POST'], auth: 'public', description: 'Exchange a valid refresh token for a new access token' },
      { path: 'auth/verify-otp', methods: ['POST'], auth: 'public', description: 'Verify one-time password for email confirmation' },
      { path: 'auth/admin/login', methods: ['POST'], auth: 'public', description: 'Admin-specific login endpoint with elevated access' },
      { path: 'auth/request-password-reset', methods: ['POST'], auth: 'public', description: 'Request a password reset email' },
      { path: 'auth/reset-password', methods: ['POST'], auth: 'public', description: 'Reset password using a valid reset token' },
    ],
  },
  {
    name: 'users',
    label: 'Users',
    icon: '👥',
    description: 'User management, profile lookup, and search',
    routes: [
      { path: 'users', methods: ['GET'], auth: 'role', description: 'List all users with search, filter, sort, and pagination' },
      { path: 'users/{id}', methods: ['GET'], auth: 'role', description: 'Get detailed information for a specific user' },
    ],
  },
  {
    name: 'admin',
    label: 'Admin',
    icon: '⚙️',
    description: 'Admin dashboard stats, settings, and platform configuration',
    routes: [
      { path: 'admin', methods: ['GET', 'PUT'], auth: 'role', description: 'Get dashboard statistics or update platform settings' },
    ],
  },
  {
    name: 'analytics',
    label: 'Analytics',
    icon: '📊',
    description: 'Platform analytics, user activity, and growth metrics',
    routes: [
      { path: 'analytics', methods: ['GET'], auth: 'role', description: 'Retrieve platform-wide analytics (DAU, MAU, engagement, etc.)' },
      { path: 'analytics/dau-mau', methods: ['GET'], auth: 'role', description: 'DAU/MAU trend data by month' },
      { path: 'analytics/regional', methods: ['GET'], auth: 'role', description: 'Regional user and garden breakdown' },
    ],
  },
  {
    name: 'gardens',
    label: 'Gardens',
    icon: '🌿',
    description: 'Virtual garden creation, management, and querying',
    routes: [
      { path: 'gardens', methods: ['GET', 'POST'], auth: 'auth', description: 'List all gardens or create a new garden' },
      { path: 'gardens/{id}', methods: ['GET', 'POST'], auth: 'auth', description: 'Get garden details or update a garden' },
      { path: 'gardens/{id}/tick', methods: ['POST'], auth: 'auth', description: 'Advance crop growth by N game-minutes (growth tick)' },
    ],
  },
  {
    name: 'crops',
    label: 'Crops',
    icon: '🌱',
    description: 'Crop lifecycle management, planting, and harvesting',
    routes: [
      { path: 'crops', methods: ['GET', 'POST'], auth: 'auth', description: 'List crops with filters or plant a new crop' },
      { path: 'crops/{id}', methods: ['GET', 'POST'], auth: 'auth', description: 'Get crop details or update crop state' },
    ],
  },
  {
    name: 'plants',
    label: 'Plants',
    icon: '🌻',
    description: 'Plant species catalog with search, filters, and details',
    routes: [
      { path: 'plants', methods: ['GET', 'POST'], auth: 'role', description: 'Browse plant species catalog or add a new species' },
      { path: 'plants/{id}', methods: ['GET', 'POST'], auth: 'role', description: 'Get plant species details or update species data' },
    ],
  },
  {
    name: 'weather',
    label: 'Weather',
    icon: '🌤️',
    description: 'Real-time weather data, forecasts, and extreme weather alerts',
    routes: [
      { path: 'weather', methods: ['GET', 'POST'], auth: 'role', description: 'Get current weather or store weather data for a region' },
      { path: 'weather/forecast', methods: ['GET'], auth: 'public', description: 'Get 5-day weather forecast for a location' },
      { path: 'weather/alerts', methods: ['GET'], auth: 'public', description: 'Get active weather alerts and extreme condition warnings' },
    ],
  },
  {
    name: 'marketplace',
    label: 'Marketplace',
    icon: '🏪',
    description: 'Product listings, transactions, and escrow-protected trading',
    routes: [
      { path: 'marketplace', methods: ['GET', 'POST'], auth: 'auth', description: 'List active marketplace listings or create a new listing' },
      { path: 'marketplace/{id}', methods: ['GET', 'POST'], auth: 'auth', description: 'Get listing details or update a marketplace listing' },
      { path: 'marketplace/{id}/buy', methods: ['GET', 'POST'], auth: 'auth', description: 'Initiate or confirm a purchase with escrow protection' },
      { path: 'marketplace/transactions', methods: ['GET'], auth: 'role', description: 'List all marketplace transactions (admin)' },
    ],
  },
  {
    name: 'community',
    label: 'Community',
    icon: '💬',
    description: 'Groups, member management, and social features',
    routes: [
      { path: 'community', methods: ['GET'], auth: 'public', description: 'Get community overview with active groups and stats' },
      { path: 'community/groups', methods: ['GET', 'POST'], auth: 'auth', description: 'List community groups or create a new group' },
      { path: 'community/groups/{id}', methods: ['POST'], auth: 'auth', description: 'Update a community group settings' },
      { path: 'community/groups/{id}/join', methods: ['POST'], auth: 'auth', description: 'Request to join or accept membership to a group' },
      { path: 'community/groups/{id}/leave', methods: ['POST'], auth: 'auth', description: 'Leave a community group' },
    ],
  },
  {
    name: 'invites',
    label: 'Invites',
    icon: '✉️',
    description: 'QR invite codes, referral links, and token-based invitations',
    routes: [
      { path: 'invites', methods: ['GET', 'POST'], auth: 'auth', description: 'List invites or generate a new invite code' },
      { path: 'invites/redeem', methods: ['POST'], auth: 'auth', description: 'Redeem an invite code to gain access' },
    ],
  },
  {
    name: 'ai',
    label: 'AI Scanner',
    icon: '🤖',
    description: 'AI-powered plant disease detection and scan history',
    routes: [
      { path: 'ai', methods: ['GET', 'POST'], auth: 'auth', description: 'Submit a plant photo for AI analysis or list scan history' },
      { path: 'ai/{id}', methods: ['GET', 'POST'], auth: 'auth', description: 'Get full scan results or update a scan record' },
    ],
  },
  {
    name: 'health',
    label: 'Health',
    icon: '❤️',
    description: 'Service health checks and system diagnostics',
    routes: [
      { path: 'health', methods: ['GET'], auth: 'public', description: 'Basic health check — returns status, uptime, and timestamp' },
      { path: 'health/detailed', methods: ['GET'], auth: 'public', description: 'Detailed health check with database connectivity and metrics' },
    ],
  },
  {
    name: 'chat',
    label: 'Chat',
    icon: '💭',
    description: 'Real-time messaging and conversation management',
    routes: [
      { path: 'chat/conversations', methods: ['GET'], auth: 'auth', description: 'List all conversations for the authenticated user' },
      { path: 'chat/messages', methods: ['GET', 'POST'], auth: 'auth', description: 'List messages in a conversation or send a new message' },
    ],
  },
  {
    name: 'moderation',
    label: 'Moderation',
    icon: '🛡️',
    description: 'Content moderation queue, reports, and actions',
    routes: [
      { path: 'moderation/reports', methods: ['GET', 'POST'], auth: 'role', description: 'List moderation reports or submit a new report' },
      { path: 'moderation/reports/{id}', methods: ['GET', 'POST'], auth: 'role', description: 'Get report details or update report status' },
    ],
  },
  {
    name: 'feature-flags',
    label: 'Feature Flags',
    icon: '🚩',
    description: 'Feature flag management for gradual rollouts and A/B testing',
    routes: [
      { path: 'feature-flags', methods: ['GET', 'POST'], auth: 'role', description: 'List all feature flags or create/update a flag' },
      { path: 'feature-flags/{key}', methods: ['GET', 'POST'], auth: 'role', description: 'Get or update a specific feature flag by key' },
    ],
  },
  {
    name: 'gamification',
    label: 'Gamification',
    icon: '🏆',
    description: 'XP, levels, achievements, streaks, and leaderboards',
    routes: [
      { path: 'gamification', methods: ['GET', 'POST'], auth: 'role', description: 'Get gamification stats or trigger XP/achievement events' },
    ],
  },
  {
    name: 'notifications',
    label: 'Notifications',
    icon: '🔔',
    description: 'Push and in-app notification management',
    routes: [
      { path: 'notifications', methods: ['GET', 'POST'], auth: 'role', description: 'List notifications or send a notification' },
      { path: 'notifications/{id}/read', methods: ['GET', 'POST'], auth: 'role', description: 'Mark a notification as read' },
    ],
  },
  {
    name: 'iot',
    label: 'IoT Devices',
    icon: '📡',
    description: 'IoT sensor device management and telemetry data',
    routes: [
      { path: 'iot', methods: ['GET', 'POST'], auth: 'auth', description: 'List IoT devices or register a new device' },
      { path: 'iot/{id}', methods: ['GET', 'POST'], auth: 'auth', description: 'Get device details or update device configuration' },
      { path: 'iot/{id}/readings', methods: ['GET', 'POST'], auth: 'auth', description: 'Get sensor readings or submit new telemetry data' },
    ],
  },
  {
    name: 'blockchain',
    label: 'Blockchain',
    icon: '⛓️',
    description: 'Smart contract interaction, token balances, and transactions',
    routes: [
      { path: 'blockchain', methods: ['GET', 'POST'], auth: 'role', description: 'List blockchain transactions or submit a new transaction' },
      { path: 'blockchain/{id}', methods: ['GET', 'POST'], auth: 'role', description: 'Get transaction details or update transaction state' },
    ],
  },
  {
    name: 'qr',
    label: 'QR Sessions',
    icon: '📱',
    description: 'Secure QR code-based trading sessions with encryption',
    routes: [
      { path: 'qr/sessions', methods: ['POST'], auth: 'auth', description: 'Create a new encrypted QR trading session' },
      { path: 'qr/sessions/verify', methods: ['POST'], auth: 'public', description: 'Verify a QR session payload (signed + encrypted)' },
      { path: 'qr/sessions/{id}', methods: ['POST'], auth: 'public', description: 'Get or update a QR session' },
    ],
  },
  {
    name: 'reputation',
    label: 'Reputation',
    icon: '⭐',
    description: 'User reputation scores, badges, and trust levels',
    routes: [
      { path: 'reputation', methods: ['GET', 'POST'], auth: 'role', description: 'List reputation scores or award reputation points' },
      { path: 'reputation/{userId}', methods: ['GET', 'POST'], auth: 'role', description: 'Get or update a specific user\'s reputation' },
    ],
  },
  {
    name: 'upload',
    label: 'Upload',
    icon: '📤',
    description: 'File upload with validation, compression, and CDN delivery',
    routes: [
      { path: 'upload', methods: ['POST'], auth: 'role', description: 'Upload a file (validates type, size, and scans for threats)' },
      { path: 'upload/{id}', methods: ['POST'], auth: 'role', description: 'Update or replace an existing uploaded file' },
    ],
  },
  {
    name: 'geo',
    label: 'Geospatial',
    icon: '🗺️',
    description: 'Geocoding, reverse geocoding, and nearby location discovery',
    routes: [
      { path: 'geo/geocode', methods: ['POST'], auth: 'auth', description: 'Convert an address to geohash coordinates' },
      { path: 'geo/nearby', methods: ['GET'], auth: 'public', description: 'Find nearby gardeners and locations using geohash prefix' },
      { path: 'geo/reverse', methods: ['POST'], auth: 'auth', description: 'Convert geohash back to a human-readable address' },
    ],
  },
  {
    name: 'intelligence',
    label: 'Intelligence',
    icon: '🧠',
    description: 'AI-driven gardening advisories and personalized recommendations',
    routes: [
      { path: 'intelligence/advisories', methods: ['GET'], auth: 'public', description: 'Get gardening advisories based on weather and region' },
      { path: 'intelligence/recommendations', methods: ['POST'], auth: 'auth', description: 'Get personalized plant and crop recommendations' },
    ],
  },
  {
    name: 'logs',
    label: 'System Logs',
    icon: '📋',
    description: 'Application logs for monitoring and debugging',
    routes: [
      { path: 'logs', methods: ['GET'], auth: 'role', description: 'List recent app logs with level and source filtering' },
    ],
  },
  {
    name: 'queues',
    label: 'Job Queues',
    icon: '📨',
    description: 'BullMQ job queue monitoring',
    routes: [
      { path: 'queues', methods: ['GET'], auth: 'role', description: 'List job queues with pending, active, completed, and failed counts' },
    ],
  },
  {
    name: 'sidecars',
    label: 'Sidecar Services',
    icon: '🔌',
    description: 'Sidecar service health and uptime monitoring',
    routes: [
      { path: 'sidecars', methods: ['GET'], auth: 'role', description: 'List sidecar services with status and uptime' },
    ],
  },
  {
    name: 'campaigns',
    label: 'Campaigns',
    icon: '📢',
    description: 'Marketing and seasonal campaigns with reward configuration',
    routes: [
      { path: 'campaigns', methods: ['GET', 'POST'], auth: 'role', description: 'List campaigns or create a new campaign' },
      { path: 'campaigns/rewards', methods: ['GET', 'POST'], auth: 'role', description: 'List campaign rewards or add a new reward' },
    ],
  },
  {
    name: 'support',
    label: 'Support Tickets',
    icon: '🎫',
    description: 'Admin support ticket management',
    routes: [
      { path: 'support/tickets', methods: ['GET', 'POST'], auth: 'role', description: 'List support tickets or create a new ticket' },
      { path: 'support/tickets/{id}/status', methods: ['PUT'], auth: 'role', description: 'Update a support ticket status and add admin notes' },
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function getMethodColor(method: string): string {
  return METHOD_COLORS[method] || 'bg-slate-600/20 text-slate-400 border-slate-500/30'
}

function getAuthStyle(auth: string): string {
  return AUTH_COLORS[auth] || AUTH_COLORS.public
}

function totalRoutes(): number {
  return MODULES.reduce((sum, m) => sum + m.routes.length, 0)
}

function totalPublicRoutes(): number {
  return MODULES.reduce((sum, m) => sum + m.routes.filter(r => r.auth === 'public').length, 0)
}

function totalProtectedRoutes(): number {
  return MODULES.reduce((sum, m) => sum + m.routes.filter(r => r.auth !== 'public').length, 0)
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function ApiDocsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(MODULES.map(m => m.name))
  )

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return MODULES
    const q = searchQuery.toLowerCase()
    return MODULES.map(mod => ({
      ...mod,
      routes: mod.routes.filter(
        r =>
          r.path.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.methods.some(m => m.toLowerCase().includes(q)) ||
          r.auth.toLowerCase().includes(q)
      ),
    })).filter(mod => mod.routes.length > 0)
  }, [searchQuery])

  const toggleModule = (name: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const expandAll = () => {
    setExpandedModules(new Set(MODULES.map(m => m.name)))
  }

  const collapseAll = () => {
    setExpandedModules(new Set())
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/api-docs/swagger"
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors font-medium"
            >
              <span className="text-xs">▶</span>
              Try APIs Live
            </Link>
            <button
              onClick={expandAll}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="btn-ghost text-xs px-3 py-1.5"
            >
              Collapse All
            </button>
          </div>
        </div>

        <div className="flex items-start gap-4 mb-6">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-admin-500/20 border border-admin-500/30 shrink-0">
            <BookOpen className="w-7 h-7 text-admin-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-slate-100 mb-1">
              GardenVerse API Documentation
            </h1>
            <p className="text-slate-400 text-base">
              Complete API Reference — All Routes
            </p>
          </div>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="card !p-4">
            <div className="card-title flex items-center gap-2">
              <Route className="w-3.5 h-3.5 text-admin-400" />
              Total Routes
            </div>
            <div className="card-value !text-xl">{totalRoutes()}</div>
          </div>
          <div className="card !p-4">
            <div className="card-title flex items-center gap-2">
              <span className="text-lg leading-none">📦</span>
              Modules
            </div>
            <div className="card-value !text-xl">{MODULES.length}</div>
          </div>
          <div className="card !p-4">
            <div className="card-title flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              Public
            </div>
            <div className="card-value !text-xl">{totalPublicRoutes()}</div>
          </div>
          <div className="card !p-4">
            <div className="card-title flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Protected
            </div>
            <div className="card-value !text-xl">{totalProtectedRoutes()}</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search routes by path, method, description, or auth level…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="input-field !pl-10 !py-3 !text-base"
          />
          {searchQuery && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {filteredModules.reduce((s, m) => s + m.routes.length, 0)} / {totalRoutes()} routes
            </span>
          )}
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-4">
        {filteredModules.map(mod => {
          const isExpanded = expandedModules.has(mod.name)

          return (
            <div key={mod.name} className="card !p-0 overflow-hidden">
              {/* Module header */}
              <button
                onClick={() => toggleModule(mod.name)}
                className="w-full flex items-center justify-between p-5 hover:bg-slate-800/30 transition-colors text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{mod.icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-base font-semibold text-slate-100">
                        {mod.label}
                      </h2>
                      <code className="text-xs font-mono text-admin-400 bg-admin-500/10 px-2 py-0.5 rounded border border-admin-500/20">
                        {mod.name}
                      </code>
                      <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                        {mod.routes.length} {mod.routes.length === 1 ? 'route' : 'routes'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                  </div>
                </div>
                <div className="shrink-0 ml-4">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-slate-500" />
                  )}
                </div>
              </button>

              {/* Routes list */}
              {isExpanded && (
                <div className="border-t border-slate-800/60">
                  <div className="divide-y divide-slate-800/40">
                    {mod.routes.map(route => (
                      <div
                        key={route.path}
                        className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-slate-800/20 transition-colors"
                      >
                        {/* Methods */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {route.methods.map(method => (
                            <span
                              key={method}
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold font-mono uppercase tracking-wider border',
                                getMethodColor(method)
                              )}
                            >
                              {method}
                            </span>
                          ))}
                        </div>

                        {/* Path */}
                        <code className="flex-1 text-sm font-mono text-slate-200 min-w-0 break-all">
                          <span className="text-slate-500">/api/v1/</span>
                          {route.path}
                        </code>

                        {/* Auth badge */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border',
                              getAuthStyle(route.auth)
                            )}
                          >
                            <span className="text-xs leading-none">
                              {AUTH_ICONS[route.auth]?.icon || '🌐'}
                            </span>
                            {route.auth === 'public'
                              ? 'Public'
                              : route.auth === 'auth'
                              ? 'Auth'
                              : 'Admin'}
                          </span>
                        </div>

                        {/* Description (visible on larger screens) */}
                        <p className="hidden lg:block text-xs text-slate-500 max-w-xs text-right shrink-0">
                          {route.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {filteredModules.length === 0 && (
        <div className="card flex flex-col items-center justify-center py-16">
          <Search className="w-12 h-12 text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-400 mb-1">
            No routes found
          </h3>
          <p className="text-sm text-slate-500">
            Try a different search term or{' '}
            <button
              onClick={() => setSearchQuery('')}
              className="text-admin-400 hover:text-admin-300 underline"
            >
              clear the filter
            </button>
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-slate-800/60 text-center">
        <p className="text-xs text-slate-600">
          GardenVerse API v1 &middot; {totalRoutes()} endpoints across {MODULES.length} modules &middot;
          Powered by Next.js App Router
        </p>
      </div>
    </div>
  )
}
