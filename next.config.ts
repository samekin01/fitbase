import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Google Places 写真（attribution 必須）
      {
        protocol: "https",
        hostname: "maps.googleapis.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  // On-Demand ISR のエンドポイントを Route Handler で実装
  experimental: {
    // サーバーアクション有効化（デフォルト on だが明示）
  },
};

export default nextConfig;
