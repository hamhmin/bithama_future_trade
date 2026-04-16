"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const Spline = dynamic(
  () => import("@splinetool/react-spline").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => <div className="w-full h-full bg-transparent" />,
  },
);

export default function HeroSection() {
  return (
    <section className="relative w-full h-screen flex items-center overflow-hidden bg-[#050d1a]">
      {/* 배경 그라디언트 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c1f3d]/60 via-[#050d1a] to-[#071428]/60" />

      {/* 배경 글로우 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-800/20 rounded-full blur-[100px]" />

      {/* Spline 3D */}
      <div className="absolute inset-0 z-0">
        {/* <Spline scene="https://prod.spline.design/iowSbsZO4Ar2i8a8/scene.splinecode" /> */}
        {/* <Spline scene="https://prod.spline.design/fsrWv3KngUZ0hQfv/scene.splinecode" /> */}
        {/* <Spline scene="https://prod.spline.design/fsrWv3KngUZ0hQfv/scene.splinecode" /> */}
      </div>

      {/* 텍스트 */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            실시간 모의 선물거래
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            실전처럼
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-blue-600 bg-clip-text text-transparent">
              트레이딩
            </span>
            을
            <br />
            연습하세요
          </h1>

          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            바이낸스 실시간 데이터로 선물거래를 연습하세요.
            <br />
            10만 USDT로 시작해 실력을 키우고 실전에 도전하세요.
          </p>

          <div className="flex items-center gap-4">
            <Link
              href="/future"
              className="px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 transition-opacity shadow-lg shadow-sky-500/20"
            >
              무료로 시작하기 →
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 rounded-xl text-base text-gray-300 border border-[#1e3a5f] hover:border-sky-500/50 hover:text-white transition-colors"
            >
              더 알아보기
            </Link>
          </div>

          <div className="flex items-center gap-8 mt-12">
            {[
              { label: "초기 지급 USDT", value: "100,000" },
              { label: "레버리지", value: "최대 125x" },
              { label: "실시간 데이터", value: "바이낸스" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-white font-bold text-xl">
                  {stat.value}
                </span>
                <span className="text-gray-500 text-xs">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
