import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { Toaster } from "react-hot-toast";
export const metadata = {
  title: {
    default: "BITHAMA",
    template: "%s | BITHAMA", // 각 페이지 title이 앞에 붙음
  },
  description: "실전 모의 선물거래 플랫폼",
};
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased`}>
      <body className="min-h-full flex flex-col">
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
        <hr />
        {children}
      </body>
    </html>
  );
}
