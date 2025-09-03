/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['ufgqmqoykddaotdbwteg.supabase.co'],
  },
  // For Capacitor
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
}

module.exports = nextConfig