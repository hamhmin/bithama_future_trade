import QueryProvider from "@/component/common/QueryProvider";

import "./globals.css";
import Script from "next/script";
import { Toaster } from "react-hot-toast";
import { headers } from "next/headers";
import {
  defaultLocale,
  getAlternateLanguages,
  getDictionary,
  getLocale,
  siteUrl,
} from "@/lib/i18n";

const GA_MEASUREMENT_ID = "G-91NCN9JLV2";
const defaultDictionary = getDictionary(defaultLocale);

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultDictionary.metadata.defaultTitle,
    // template: "%s | BITHAMA",
  },
  description: defaultDictionary.metadata.description,
  keywords: [...defaultDictionary.metadata.keywords],
  alternates: {
    canonical: "/ko",
    languages: getAlternateLanguages(),
  },
  openGraph: {
    title: defaultDictionary.metadata.defaultTitle,
    description: defaultDictionary.metadata.description,
    url: `${siteUrl}/ko`,
    siteName: "BITHAMA",
    locale: "ko_KR",
    type: "website",
    images: [
      { url: `${siteUrl}/og-image.png`, width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultDictionary.metadata.defaultTitle,
    description: defaultDictionary.metadata.description,
    images: [`${siteUrl}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers();
  const locale = getLocale(requestHeaders.get("x-bithama-locale") ?? undefined);

  return (
    <html lang={locale} className={`h-full antialiased`}>
      <head>
        <meta
          name="naver-site-verification"
          content="5b7f1dea72120664c4326bf462842d23657c2d1f"
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <QueryProvider>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#1f2937",
                color: "#fff",
                border: "1px solid #374151",
                fontSize: "13px",
              },
              success: {
                iconTheme: {
                  primary: "#22c55e",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
              duration: 3000,
            }}
          />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
