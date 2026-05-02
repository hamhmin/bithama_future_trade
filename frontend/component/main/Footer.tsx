import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#050d1a] border-t border-[#1e3a5f]/50 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-600 bg-clip-text text-transparent">
              BITHAMA
            </span>
            <p className="text-gray-500 text-sm">실전 모의 선물거래 플랫폼</p>
          </div>
          <div className="flex items-center gap-8 text-sm text-gray-500">
            <Link href="/future" className="hover:text-white transition-colors">
              거래소
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              로그인
            </Link>
            <Link
              href="/privacy"
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              개인정보처리방침
            </Link>
            <Link
              href="/terms"
              className="text-gray-500 hover:text-gray-300 text-xs"
            >
              서비스 이용약관
            </Link>
            <a
              className="text-gray-500 hover:text-gray-300 text-xs transition-colors"
              href="mailto:admin@bithama.com"
            >
              문의하기
            </a>
            <span>© 2026 BITHAMA. All rights reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
