import MainHeader from "@/component/main/MainHeader";
import HeroSection from "@/component/main/HeroSection";
import FeatureSection from "@/component/main/FeatureSection";
import Footer from "@/component/main/Footer";
import { defaultLocale, getDictionary } from "@/lib/i18n";

const dictionary = getDictionary(defaultLocale);

export const metadata = {
  title: dictionary.metadata.title,
  description: dictionary.metadata.description,
};

export default function MainPage() {
  return (
    <main className="bg-gray-950 min-h-screen">
      <MainHeader locale={defaultLocale} dictionary={dictionary.header} />
      <HeroSection dictionary={dictionary.hero} />
      <FeatureSection dictionary={dictionary.features} />
      <Footer dictionary={dictionary.footer} />
    </main>
  );
}
