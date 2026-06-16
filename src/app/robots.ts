import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitbase.jp";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
