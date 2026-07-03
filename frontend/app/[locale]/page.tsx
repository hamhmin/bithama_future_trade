import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MainHeader from "@/component/main/MainHeader";
import HeroSection from "@/component/main/HeroSection";
import FeatureSection from "@/component/main/FeatureSection";
import Footer from "@/component/main/Footer";
import {
  getAlternateLanguages,
  getDictionary,
  getLocale,
  isLocale,
  localeOgMap,
  locales,
  siteUrl,
  type Locale,
} from "@/lib/i18n";

type LocalePageProps = {
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocalePageProps): Promise<Metadata> {
  const { locale: localeParam } = await params;
  const locale = getLocale(localeParam);
  const dictionary = getDictionary(locale);
  const otherLocales = locales.filter((item) => item !== locale);

  return {
    title: dictionary.metadata.title,
    description: dictionary.metadata.description,
    keywords: [...dictionary.metadata.keywords],
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: getAlternateLanguages(),
    },
    openGraph: {
      title: dictionary.metadata.title,
      description: dictionary.metadata.description,
      url: `${siteUrl}/${locale}`,
      siteName: "BITHAMA",
      locale: localeOgMap[locale],
      alternateLocale: otherLocales.map((item) => localeOgMap[item]),
      type: "website",
      images: [
        {
          url: `${siteUrl}/og-image.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: dictionary.metadata.title,
      description: dictionary.metadata.description,
      images: [`${siteUrl}/og-image.png`],
    },
  };
}

export default async function LocaleMainPage({ params }: LocalePageProps) {
  const { locale: localeParam } = await params;

  if (!isLocale(localeParam)) {
    notFound();
  }

  const locale: Locale = localeParam;
  const dictionary = getDictionary(locale);

  return (
    <main className="bg-gray-950 min-h-screen">
      <MainHeader locale={locale} dictionary={dictionary.header} />
      <HeroSection dictionary={dictionary.hero} />
      <FeatureSection dictionary={dictionary.features} />
      <Footer dictionary={dictionary.footer} />
    </main>
  );
}
