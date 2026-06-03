/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // MapLibre ships as ESM with worker assets; transpile for Next bundling.
  transpilePackages: ['maplibre-gl'],
  experimental: {
    optimizePackageImports: ['recharts', 'framer-motion'],
  },
};

export default nextConfig;
