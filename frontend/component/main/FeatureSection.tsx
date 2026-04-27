"use client";

const features = [
  {
    icon: "📊",
    title: "실시간 차트",
    description:
      "바이낸스 실시간 데이터 기반 캔들차트. 1분부터 1일까지 다양한 타임프레임 지원.",
    gradient: "from-sky-500/20 to-sky-600/5",
    border: "border-sky-500/20",
  },
  {
    icon: "⚡",
    title: "즉시 체결",
    description:
      "시장가/지정가 주문 지원. 실제 거래소와 동일한 체결 로직으로 실전 경험 제공.",
    gradient: "from-blue-600/20 to-blue-700/5",
    border: "border-blue-600/20",
  },
  {
    icon: "🎯",
    title: "TP/SL 설정",
    description:
      "Take Profit / Stop Loss 자동 설정. 리스크 관리 전략을 연습하세요.",
    gradient: "from-sky-400/20 to-sky-500/5",
    border: "border-sky-400/20",
  },
  {
    icon: "📈",
    title: "레버리지 거래",
    description: "최대 100배 레버리지. Isolated/Cross 마진 방식 모두 지원.",
    gradient: "from-blue-500/20 to-blue-600/5",
    border: "border-blue-500/20",
  },
  {
    icon: "💰",
    title: "펀딩비 시스템",
    description: "실제 바이낸스 펀딩비율 적용. 실전과 동일한 환경에서 연습.",
    gradient: "from-sky-600/20 to-sky-700/5",
    border: "border-sky-600/20",
  },
  {
    icon: "🔒",
    title: "안전한 연습",
    description:
      "가상 자산으로 리스크 없이 연습. 실력이 쌓이면 실전에 도전하세요.",
    gradient: "from-blue-700/20 to-blue-800/5",
    border: "border-blue-700/20",
  },
];

export default function FeatureSection() {
  return (
    <section id="features" className="py-32 bg-[#050d1a] relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-sky-500/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs mb-4">
            주요 기능
          </div>
          <h2 className="text-4xl font-bold text-white mb-4">
            실전과 동일한
            <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
              {" "}
              거래 환경
            </span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            바이낸스 실시간 데이터를 기반으로 실전과 동일한 환경에서 트레이딩을
            연습하세요.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.border} hover:scale-[1.02] transition-transform duration-300`}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-white font-bold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
