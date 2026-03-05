import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bunkezy-storage.s3.ap-south-1.amazonaws.com',
        pathname: '/**'
      }
    ]
  }
};

export default nextConfig;
