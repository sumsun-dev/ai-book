/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@anthropic-ai/sdk'],
    serverActions: {
      bodySizeLimit: '50mb',
    },
  },
}

module.exports = nextConfig
