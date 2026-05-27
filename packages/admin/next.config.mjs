import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@gardenverse/backend'],
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.gardenverse.io',
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: false,
  telemetry: false,
  widenClientFileUpload: true,
  tunnelRoute: '/monitoring',
});
