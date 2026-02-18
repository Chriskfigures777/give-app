import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  webpack: (config, { dev }) => {
    // Disable cache in dev to prevent corruption from interrupted builds
    if (dev) config.cache = false;
    config.resolve ??= {};
    config.resolve.alias ??= {};
    (config.resolve.alias as Record<string, string>)["class-variance-authority"] = path.resolve(
      process.cwd(),
      "node_modules/class-variance-authority"
    );
    return config;
  },
  // Externalize Supabase to avoid vendor-chunk path resolution failures in static-paths-worker
  // pdf-lib: required for PDF generation in API routes (receipts, year-end)
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr", "pdf-lib"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
      { protocol: "https", hostname: "images.pexels.com", pathname: "/**" },
      { protocol: "https", hostname: "img.evbuc.com", pathname: "/**" },
    ],
    // Skip Next.js optimization for external images to avoid upstream timeouts
    // (Unsplash/Pexels CDNs already serve optimized images)
    unoptimized: true,
  },
  experimental: {
    // Disable Turbopack filesystem cache - avoids "Failed to open database" / "invalid digit found in string"
    // when project path contains spaces or special chars (e.g. "Stripe_ GIVE")
    turbopackFileSystemCacheForDev: false,
    optimizePackageImports: [
      "lucide-react",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-label",
      "@radix-ui/react-select",
      "@radix-ui/react-separator",
      "@radix-ui/react-slot",
      "@radix-ui/react-tabs",
      "recharts",
      "motion",
      "gsap",
      "@gsap/react",
    ],
  },
};

export default nextConfig;
