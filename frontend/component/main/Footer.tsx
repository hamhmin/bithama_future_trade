import Link from "next/link";
import type { LandingDictionary } from "@/lib/i18n";

export default function Footer({
  dictionary,
}: {
  dictionary: LandingDictionary["footer"];
}) {
  return (
    <footer id="about" className="bg-[#050d1a] border-t border-[#1e3a5f]/50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2 text-center md:text-left">
            <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
              BITHAMA
            </span>
            <p className="text-gray-500 text-sm">{dictionary.tagline}</p>
          </div>
          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 text-sm text-gray-500">
            <Link href="/future" className="hover:text-white transition-colors">
              {dictionary.exchange}
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              {dictionary.login}
            </Link>
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              {dictionary.privacy}
            </Link>
            <Link
              href="/terms"
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              {dictionary.terms}
            </Link>
            <a
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              href="mailto:admin@bithama.com"
            >
              {dictionary.contact}
            </a>
            <span>{dictionary.rights}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
