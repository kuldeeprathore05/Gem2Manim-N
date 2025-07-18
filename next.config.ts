import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.saasworthy.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Allow SVG files
    dangerouslyAllowSVG: true,
    // Optional: Add content security policy for SVGs
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
