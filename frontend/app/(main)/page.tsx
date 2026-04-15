import MainHeader from "@/component/main/MainHeader";
import HeroSection from "@/component/main/HeroSection";
import FeatureSection from "@/component/main/FeatureSection";
import Footer from "@/component/main/Footer";
export const metadata = {
  title: "BITHAMA - 실전 모의 선물거래",
  description: "바이낸스 실시간 데이터로 선물거래를 연습하세요.",
};

export default function MainPage() {
  return (
    <main className="bg-gray-950 min-h-screen">
      <MainHeader />
      <HeroSection />
      <FeatureSection />
      <Footer />
    </main>
  );
}
