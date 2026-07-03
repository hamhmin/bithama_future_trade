import Link from "next/link";
import type { LandingDictionary } from "@/lib/i18n";

export default function HeroSection({
  dictionary,
}: {
  dictionary: LandingDictionary["hero"];
}) {
  return (
    <section className="relative w-full md:h-screen flex items-center overflow-hidden bg-[#050d1a] pt-[88px] md:pt-0 h-full">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0c1f3d]/60 via-[#050d1a] to-[#071428]/60" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-blue-800/20 rounded-full blur-[100px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            {dictionary.badge}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            {dictionary.titleTop}
            <br />
            <span className="bg-gradient-to-r from-sky-400 via-blue-400 to-blue-600 bg-clip-text text-transparent">
              {dictionary.titleAccent}
            </span>
            <br />
            {dictionary.titleBottom}
          </h1>

          <p className="text-gray-400 text-lg mb-8 leading-relaxed">
            {dictionary.descriptionLines.map((line) => (
              <span key={line}>
                {line}
                <br />
              </span>
            ))}
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/future"
              className="px-8 py-4 rounded-xl text-base font-bold text-white bg-gradient-to-r from-sky-500 to-blue-700 hover:opacity-90 transition-opacity shadow-lg shadow-sky-500/20"
            >
              {dictionary.primaryCta}
            </Link>
            <Link
              href="#features"
              className="px-8 py-4 rounded-xl text-base text-gray-300 border border-[#1e3a5f] hover:border-sky-500/50 hover:text-white transition-colors"
            >
              {dictionary.secondaryCta}
            </Link>
          </div>

          <div className="flex items-start md:items-center gap-8 mt-12 flex-wrap md:flex-nowrap">
            {dictionary.stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col w-full text-center md:text-left"
              >
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
