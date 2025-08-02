/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are now enabled by default in Next.js 14
  // No need for experimental.serverActions
  
  // Skip ESLint during build on Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
