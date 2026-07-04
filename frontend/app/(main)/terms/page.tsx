import { headers } from "next/headers";
import { getLocale } from "@/lib/i18n";
import { translateRuntimeText } from "@/lib/runtimeTranslations";

export async function generateMetadata() {
  const requestHeaders = await headers();
  const locale = getLocale(requestHeaders.get("x-bithama-locale") ?? undefined);

  return {
    title: `${translateRuntimeText(locale, "서비스 이용약관")} | BITHAMA`,
  };
}

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#050d1a] text-white py-16 px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">서비스 이용약관</h1>
          <p className="text-gray-400 text-sm">최종 수정일: 2026년 4월 18일</p>
        </div>

        {[
          {
            title: "제1조 (목적)",
            content:
              "본 약관은 BITHAMA(이하 '서비스')가 제공하는 모의 선물거래 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.",
          },
          {
            title: "제2조 (서비스 성격)",
            content:
              "BITHAMA는 실제 자산 거래가 이루어지지 않는 모의(가상) 선물거래 플랫폼입니다. 서비스 내 모든 자산은 가상 자산이며 실제 금전적 가치가 없습니다. 실제 투자 결정에 활용하지 마세요.",
          },
          {
            title: "제3조 (회원가입)",
            content:
              "서비스 이용을 위해 이메일, 비밀번호, 닉네임으로 회원가입할 수 있습니다. 타인의 정보를 도용하거나 허위 정보로 가입하는 것을 금지합니다.",
          },
          {
            title: "제4조 (서비스 이용)",
            content:
              "이용자는 서비스를 합법적인 목적으로만 사용해야 합니다. 서비스를 통해 타인에게 피해를 주거나 서비스 운영을 방해하는 행위를 금지합니다.",
          },
          {
            title: "제5조 (서비스 중단)",
            content:
              "서비스는 기술적 문제, 점검, 또는 기타 사유로 일시적으로 중단될 수 있습니다. 서비스 중단으로 인한 손해에 대해 책임을 지지 않습니다.",
          },
          {
            title: "제6조 (면책조항)",
            content:
              "BITHAMA는 모의 거래 서비스로 실제 투자 손익과 무관합니다. 서비스 이용으로 인한 실제 투자 손실에 대해 책임을 지지 않습니다. 바이낸스 API를 통한 실시간 데이터를 제공하나 데이터의 정확성을 보장하지 않습니다.",
          },
          {
            title: "제7조 (약관 변경)",
            content:
              "서비스는 필요에 따라 약관을 변경할 수 있으며, 변경 시 서비스 내 공지합니다. 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단할 수 있습니다.",
          },
          {
            title: "제8조 (문의)",
            content:
              "서비스 이용 관련 문의는 admin@bithama.com 으로 연락해주세요.",
          },
        ].map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-white">{section.title}</h2>
            <p className="text-gray-400 leading-relaxed">{section.content}</p>
          </div>
        ))}

        <div className="border-t border-gray-700 pt-6">
          <p className="text-gray-600 text-sm">
            본 약관은 2026년 4월 18일부터 적용됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}
