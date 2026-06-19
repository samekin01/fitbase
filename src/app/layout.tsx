import type { Metadata } from "next";
import Script from "next/script";
import { ClickTracker } from "@/components/ClickTracker";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fitbase.jp";
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const googleSiteVerification = process.env.GOOGLE_SITE_VERIFICATION;
const clarityProjectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;

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
  ...(googleSiteVerification ? { verification: { google: googleSiteVerification } } : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        {children}
        <ClickTracker />
        {gaMeasurementId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}');
              `}
            </Script>
          </>
        )}
        {clarityProjectId && (
          <Script id="clarity-init" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${clarityProjectId}");
            `}
          </Script>
        )}
      </body>
    </html>
  );
}
