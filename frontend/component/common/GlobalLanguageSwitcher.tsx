"use client";

import LanguageSwitcher from "@/component/main/LanguageSwitcher";
import { useI18n } from "@/component/common/I18nProvider";

export default function GlobalLanguageSwitcher() {
  const { locale } = useI18n();

  return (
    <div className="fixed bottom-4 left-4 z-[120]">
      <LanguageSwitcher locale={locale} />
    </div>
  );
}
