import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Temporary permissive image config for development.
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      },
      {
        protocol: 'http',
        hostname: '**'
      }
    ]
  }
};

export default nextConfig;
