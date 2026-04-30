import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
export const metadata = {
  title: {
    default: "BITHAMA - 모의 선물거래 플랫폼",
    // template: "%s | BITHAMA",
  },
  description:
    "바이낸스 실시간 데이터로 실전과 동일한 환경에서 선물거래를 연습하세요. 가상 자산으로 리스크 없이 트레이딩을 경험해보세요.",
  keywords: [
    "모의 선물거래",
    "가상 선물거래",
    "비트코인 거래 연습",
    "선물거래 시뮬레이터",
    "BITHAMA",
  ],
  openGraph: {
    title: "BITHAMA - 모의 선물거래 플랫폼",
    description:
      "바이낸스 실시간 데이터로 실전과 동일한 환경에서 선물거래를 연습하세요.",
    url: "https://bithama.com",
    siteName: "BITHAMA",
    locale: "ko_KR",
    type: "website",
    images: [
      { url: "https://bithama.com/og-image.png", width: 1200, height: 630 },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BITHAMA - 모의 선물거래 플랫폼",
    description:
      "바이낸스 실시간 데이터로 실전과 동일한 환경에서 선물거래를 연습하세요.",
    images: ["https://bithama.com/og-image.png"],
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
    <html lang="en" className={`h-full antialiased`}>
      <head>
        <meta
          name="naver-site-verification"
          content="5b7f1dea72120664c4326bf462842d23657c2d1f"
        />
      </head>
      <body className="min-h-full flex flex-col overflow-x-hidden">
        <div className="hidden">
          <Link href={"/"}>index</Link>
          <br />
          <Link href={"/future"}>future</Link>
        </div>
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
      </body>
    </html>
  );
}
