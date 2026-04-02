import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="">
          <Link href={"/"}>index</Link>
          <br />
          <Link href={"/future"}>future</Link>
        </div>
        <hr />
        {children}
      </body>
    </html>
  );
}
