export const metadata = { title: "개인정보처리방침 | BITHAMA" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#050d1a] text-white py-16 px-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">개인정보처리방침</h1>
          <p className="text-gray-400 text-sm">최종 수정일: 2026년 4월 18일</p>
        </div>

        {[
          {
            title: "1. 수집하는 개인정보",
            content:
              "BITHAMA는 서비스 이용을 위해 이메일 주소, 닉네임을 수집합니다. 비밀번호는 암호화하여 저장되며 원문은 보관하지 않습니다.",
          },
          {
            title: "2. 개인정보 이용 목적",
            content:
              "수집한 개인정보는 회원 식별, 서비스 제공, 서비스 개선 목적으로만 사용됩니다. 제3자에게 제공하지 않습니다.",
          },
          {
            title: "3. 개인정보 보유 기간",
            content:
              "회원 탈퇴 시까지 보관하며, 탈퇴 시 즉시 파기합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관합니다.",
          },
          {
            title: "4. 쿠키 사용",
            content:
              "로그인 유지를 위해 httpOnly 쿠키를 사용합니다. 쿠키는 브라우저 설정에서 거부할 수 있으나, 거부 시 로그인이 필요한 서비스 이용이 제한될 수 있습니다.",
          },
          {
            title: "5. 개인정보 보호 조치",
            content:
              "비밀번호 암호화(bcrypt), HTTPS 통신, httpOnly 쿠키 사용 등 기술적 조치를 통해 개인정보를 보호합니다.",
          },
          {
            title: "6. 이용자의 권리",
            content:
              "이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다. 개인정보 관련 문의는 아래 연락처로 해주세요.",
          },
          {
            title: "7. 문의",
            content:
              "개인정보 처리에 관한 문의사항은 bithama.contact@gmail.com 으로 연락해주세요.",
          },
        ].map((section) => (
          <div key={section.title} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold text-white">{section.title}</h2>
            <p className="text-gray-400 leading-relaxed">{section.content}</p>
          </div>
        ))}

        <div className="border-t border-gray-700 pt-6">
          <p className="text-gray-600 text-sm">
            본 방침은 2026년 4월 18일부터 적용됩니다.
          </p>
        </div>
      </div>
    </main>
  );
}
