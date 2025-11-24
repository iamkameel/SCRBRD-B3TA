/** @type {import('next').NextConfig} */
const withPWAInit = require('@ducanh2912/next-pwa').default;

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['genkit'],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: 'maverickdesign.co.za' },
      { protocol: 'https', hostname: 'firebasestudio-hosting.web.app' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'tile.openstreetmap.org' },
    ],
  },
};

module.exports = withPWA(nextConfig);
