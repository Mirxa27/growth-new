/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['ufgqmqoykddaotdbwteg.supabase.co'],
  },
  // Comment out for development, uncomment for Capacitor build
  // output: 'export',
  // distDir: 'out',
  // trailingSlash: true,
}

module.exports = nextConfig