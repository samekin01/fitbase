import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitbase.jp";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FitBase - 東海エリアのパーソナルジム検索・比較",
    template: "%s | FitBase",
  },
  description:
    "愛知・岐阜・三重・静岡のパーソナルジムを比較・検索。料金・特徴・エリアで絞り込めるジム情報メディア。",
  openGraph: {
    siteName: "FitBase",
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
