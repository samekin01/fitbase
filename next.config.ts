import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
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
    serverActions: {
      // 画像アップロード（最大5MB）がデフォルト1MB制限に収まるよう拡張
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
