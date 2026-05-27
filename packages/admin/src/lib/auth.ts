import { AuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import api from './api'

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        try {
          const res = await api.post('/auth/admin/login', {
            email: credentials.email,
            password: credentials.password,
          })
          const user = res.data
          if (user && user.token) {
            return {
              id: user.id,
              email: user.email,
              name: user.displayName || user.username,
              image: user.avatar,
              role: user.role,
              token: user.token,
            }
          }
          return null
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as unknown as { role: string }).role
        token.accessToken = (user as unknown as { token: string }).token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role: string }).role = token.role as string
        (session.user as { accessToken: string }).accessToken = token.accessToken as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60,
  },
  secret: process.env.NEXTAUTH_SECRET || 'gardenverse-admin-secret-change-in-production',
}

export function isAdmin(role?: string): boolean {
  return role === 'admin'
}

export function isModerator(role?: string): boolean {
  return role === 'moderator' || role === 'admin'
}

export function canManageRoles(currentRole: string, targetRole: string): boolean {
  if (currentRole !== 'admin') return false
  return targetRole !== 'admin'
}
