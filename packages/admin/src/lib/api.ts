import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface DashboardStats {
  dau: number
  wau: number
  mau: number
  totalUsers: number
  activeGardens: number
  marketplaceVolume: number
  marketplaceTransactions: number
  revenue: number
  creditsIssued: number
  systemUptime: number
  activeIoTDevices: number
  pendingReports: number
  serverLoad: number
  apiLatency: number
}

export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  level: number
  xp: number
  role: 'admin' | 'moderator' | 'user' | 'premium'
  status: 'active' | 'suspended' | 'banned' | 'inactive'
  joinedAt: string
  lastLoginAt: string
  gardens: number
  invitesUsed: number
  reports: number
}

export interface Report {
  id: string
  type: string
  status: 'pending' | 'resolved' | 'dismissed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  reporterId: string
  reporterName: string
  targetId: string
  targetName: string
  reason: string
  description: string
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  action?: string
}

export interface MarketplaceListing {
  id: string
  title: string
  sellerName: string
  price: number
  category: string
  status: 'active' | 'flagged' | 'sold' | 'removed'
  createdAt: string
  reports: number
  views: number
}

export interface FeatureFlag {
  id: string
  key: string
  name: string
  description: string
  enabled: boolean
  rolloutPercentage: number
  regions: string[]
  userOverrides: { userId: string; enabled: boolean }[]
  createdBy: string
  updatedAt: string
}

export interface SupportTicket {
  id: string
  subject: string
  message: string
  status: string
  priority: string
  userId: string
  user: { id: string; username: string; email: string }
  assignedTo?: { id: string; username: string; email: string } | null
  assignedToId?: string | null
  adminNotes?: string | null
  closedAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface AdminNotification {
  id: string
  type: string
  title: string
  body: string
  isRead: boolean
  createdAt: string
}

export interface Achievement {
  id: string
  key: string
  name: string
  description: string
  icon: string
  category: string
  maxProgress: number
  xpReward: number
  tokenReward: number
}

export interface ShopItem {
  id: string
  name: string
  description: string
  price: number
  currency: string
  icon: string
  category: string
  levelRequired: number
  isLimited: boolean
  stock: number | null
}

export interface UserEnergy {
  current: number
  max: number
  regenRate: number
}

export default api
