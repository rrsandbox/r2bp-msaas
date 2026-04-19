import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  productionBrowserSourceMaps: false,
  experimental: {
    webVitalsAttribution: [],
  },
  onDemandEntries: {
    maxInactiveAge: 15 * 60 * 1000,
    pagesBufferLength: 2,
  },
  env: {
    NEXT_PUBLIC_VERCEL_ANALYTICS_ID: "",
  },
  devIndicators: false,
};

export default nextConfig;
