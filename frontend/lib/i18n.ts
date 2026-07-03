export const locales = ["ko", "en", "ja"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";
export const localeCookieName = "bithama_locale";
export const siteUrl = "https://bithama.com";

export const localeLabels: Record<Locale, string> = {
  ko: "한국어",
  en: "English",
  ja: "日本語",
};

export const localeOgMap: Record<Locale, string> = {
  ko: "ko_KR",
  en: "en_US",
  ja: "ja_JP",
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && locales.includes(value as Locale);
}

export function getLocale(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export function getLocalePath(locale: Locale) {
  return `/${locale}`;
}

export function getAlternateLanguages() {
  return {
    ko: `${siteUrl}/ko`,
    en: `${siteUrl}/en`,
    ja: `${siteUrl}/ja`,
    "x-default": `${siteUrl}/ko`,
  };
}

export const dictionaries = {
  ko: {
    metadata: {
      title: "BITHAMA - 실전 모의 선물거래",
      defaultTitle: "BITHAMA - 모의 선물거래 플랫폼",
      description:
        "바이낸스 실시간 데이터로 선물거래를 연습하세요. 10만 USDT 가상 자산으로 리스크 없이 트레이딩을 경험해보세요.",
      keywords: [
        "모의 선물거래",
        "가상 선물거래",
        "비트코인 거래 연습",
        "선물거래 시뮬레이터",
        "BITHAMA",
      ],
    },
    header: {
      exchange: "거래소",
      features: "기능",
      about: "소개",
      startTrading: "거래 시작",
      login: "로그인",
      start: "시작하기",
      logout: "로그아웃",
      language: "언어 선택",
    },
    hero: {
      badge: "실시간 모의 선물거래",
      titleTop: "실전처럼",
      titleAccent: "트레이딩",
      titleBottom: "연습하세요",
      descriptionLines: [
        "바이낸스 실시간 데이터로 선물거래를 연습하세요.",
        "10만 USDT로 시작해 실력을 키우고 실전에 도전하세요.",
      ],
      primaryCta: "무료로 시작하기",
      secondaryCta: "더 알아보기",
      stats: [
        { label: "초기 지급 USDT", value: "100,000" },
        { label: "레버리지", value: "최대 100x" },
        { label: "실시간 데이터", value: "바이낸스" },
      ],
    },
    features: {
      eyebrow: "주요 기능",
      titlePrefix: "실전과 동일한",
      titleAccent: "거래 환경",
      description:
        "바이낸스 실시간 데이터를 기반으로 실전과 동일한 환경에서 트레이딩을 연습하세요.",
      items: [
        {
          icon: "RT",
          title: "실시간 차트",
          description:
            "바이낸스 실시간 데이터 기반 캔들차트. 1분부터 1일까지 다양한 타임프레임을 지원합니다.",
        },
        {
          icon: "EX",
          title: "즉시 체결",
          description:
            "시장가와 지정가 주문을 지원하며 실제 거래소와 유사한 체결 로직을 제공합니다.",
        },
        {
          icon: "TP",
          title: "TP/SL 설정",
          description:
            "Take Profit과 Stop Loss를 자동 설정해 리스크 관리 전략을 연습할 수 있습니다.",
        },
        {
          icon: "LV",
          title: "레버리지 거래",
          description:
            "최대 100배 레버리지와 Isolated/Cross 마진 방식을 모두 지원합니다.",
        },
        {
          icon: "FD",
          title: "펀딩비 시스템",
          description:
            "실제 바이낸스 펀딩비를 반영해 실전과 유사한 환경에서 연습합니다.",
        },
        {
          icon: "RS",
          title: "안전한 연습",
          description:
            "가상 자산으로 리스크 없이 반복 연습하고 실력을 쌓을 수 있습니다.",
        },
      ],
    },
    footer: {
      tagline: "실전 모의 선물거래 플랫폼",
      exchange: "거래소",
      login: "로그인",
      privacy: "개인정보처리방침",
      terms: "서비스 이용약관",
      contact: "문의하기",
      rights: "© 2026 BITHAMA. All rights reserved.",
    },
  },
  en: {
    metadata: {
      title: "BITHAMA - Practice Crypto Futures Trading",
      defaultTitle: "BITHAMA - Crypto Futures Trading Simulator",
      description:
        "Practice crypto futures trading with real-time Binance market data. Start with 100,000 virtual USDT and train without financial risk.",
      keywords: [
        "crypto futures simulator",
        "paper futures trading",
        "bitcoin trading practice",
        "virtual futures trading",
        "BITHAMA",
      ],
    },
    header: {
      exchange: "Exchange",
      features: "Features",
      about: "About",
      startTrading: "Start trading",
      login: "Log in",
      start: "Start",
      logout: "Log out",
      language: "Select language",
    },
    hero: {
      badge: "Real-time futures simulator",
      titleTop: "Practice",
      titleAccent: "trading",
      titleBottom: "like it is live",
      descriptionLines: [
        "Train on crypto futures with real-time Binance market data.",
        "Start with 100,000 virtual USDT, build skill, and prepare for live markets.",
      ],
      primaryCta: "Start for free",
      secondaryCta: "Explore features",
      stats: [
        { label: "Starting USDT", value: "100,000" },
        { label: "Leverage", value: "Up to 100x" },
        { label: "Market data", value: "Binance" },
      ],
    },
    features: {
      eyebrow: "Key features",
      titlePrefix: "A realistic",
      titleAccent: "trading environment",
      description:
        "Practice trading in a live-like futures environment powered by real-time Binance market data.",
      items: [
        {
          icon: "RT",
          title: "Real-time charts",
          description:
            "Candlestick charts powered by Binance data with multiple timeframes from 1 minute to 1 day.",
        },
        {
          icon: "EX",
          title: "Fast execution",
          description:
            "Market and limit orders with execution behavior designed to feel close to a real exchange.",
        },
        {
          icon: "TP",
          title: "TP/SL controls",
          description:
            "Set Take Profit and Stop Loss orders to practice risk management strategies.",
        },
        {
          icon: "LV",
          title: "Leverage trading",
          description:
            "Use up to 100x leverage with both Isolated and Cross margin modes.",
        },
        {
          icon: "FD",
          title: "Funding fees",
          description:
            "Train with funding fee mechanics that follow live Binance futures market conditions.",
        },
        {
          icon: "RS",
          title: "Risk-free practice",
          description:
            "Use virtual capital to practice repeatedly without putting real money at risk.",
        },
      ],
    },
    footer: {
      tagline: "Crypto futures trading simulator",
      exchange: "Exchange",
      login: "Log in",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      contact: "Contact",
      rights: "© 2026 BITHAMA. All rights reserved.",
    },
  },
  ja: {
    metadata: {
      title: "BITHAMA - 暗号資産先物取引の練習",
      defaultTitle: "BITHAMA - 暗号資産先物取引シミュレーター",
      description:
        "Binanceのリアルタイムデータで暗号資産先物取引を練習できます。10万USDTの仮想資産でリスクなくトレードを体験しましょう。",
      keywords: [
        "暗号資産先物 シミュレーター",
        "仮想先物取引",
        "ビットコイン取引練習",
        "先物取引デモ",
        "BITHAMA",
      ],
    },
    header: {
      exchange: "取引所",
      features: "機能",
      about: "紹介",
      startTrading: "取引を始める",
      login: "ログイン",
      start: "始める",
      logout: "ログアウト",
      language: "言語を選択",
    },
    hero: {
      badge: "リアルタイム先物取引シミュレーター",
      titleTop: "本番のように",
      titleAccent: "トレードを",
      titleBottom: "練習しよう",
      descriptionLines: [
        "Binanceのリアルタイムデータで先物取引を練習できます。",
        "10万USDTの仮想資産で始めて、実戦に向けた経験を積みましょう。",
      ],
      primaryCta: "無料で始める",
      secondaryCta: "詳しく見る",
      stats: [
        { label: "初期USDT", value: "100,000" },
        { label: "レバレッジ", value: "最大100x" },
        { label: "市場データ", value: "Binance" },
      ],
    },
    features: {
      eyebrow: "主な機能",
      titlePrefix: "実戦に近い",
      titleAccent: "取引環境",
      description:
        "Binanceのリアルタイムデータをもとに、実戦に近い環境でトレードを練習できます。",
      items: [
        {
          icon: "RT",
          title: "リアルタイムチャート",
          description:
            "Binanceデータを使ったローソク足チャート。1分足から1日足まで複数の時間軸に対応します。",
        },
        {
          icon: "EX",
          title: "スピーディーな約定",
          description:
            "成行注文と指値注文に対応し、実際の取引所に近い約定体験を提供します。",
        },
        {
          icon: "TP",
          title: "TP/SL設定",
          description:
            "利確と損切りを設定し、リスク管理の戦略を練習できます。",
        },
        {
          icon: "LV",
          title: "レバレッジ取引",
          description:
            "最大100倍のレバレッジとIsolated/Crossの両方のマージン方式に対応します。",
        },
        {
          icon: "FD",
          title: "資金調達料",
          description:
            "Binance先物市場の資金調達料を反映した環境で練習できます。",
        },
        {
          icon: "RS",
          title: "リスクなしで練習",
          description:
            "仮想資産を使って、実際の資金を失うリスクなく繰り返し練習できます。",
        },
      ],
    },
    footer: {
      tagline: "暗号資産先物取引シミュレーター",
      exchange: "取引所",
      login: "ログイン",
      privacy: "プライバシーポリシー",
      terms: "利用規約",
      contact: "お問い合わせ",
      rights: "© 2026 BITHAMA. All rights reserved.",
    },
  },
} as const;

export type LandingDictionary = (typeof dictionaries)[Locale];

export function getDictionary(locale: Locale): LandingDictionary {
  return dictionaries[locale];
}
