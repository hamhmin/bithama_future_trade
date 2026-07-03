"use client";

import { localeCookieName, localeLabels, locales, type Locale } from "@/lib/i18n";
import { useI18n } from "@/component/common/I18nProvider";

export default function LanguageSwitcher({
  locale: localeProp,
  label = "Select language",
}: {
  locale?: Locale;
  label?: string;
}) {
  const { locale: contextLocale } = useI18n();
  const locale = localeProp ?? contextLocale;

  const handleChange = (nextLocale: Locale) => {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem(localeCookieName, nextLocale);

    const { pathname, search, hash } = window.location;
    const segments = pathname.split("/");
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = nextLocale;
      window.location.href = `${segments.join("/")}${search}${hash}`;
      return;
    }

    window.location.reload();
  };

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-2 text-sm"
      >
        🌐
      </span>
      <select
        value={locale}
        onChange={(event) => handleChange(event.target.value as Locale)}
        aria-label={label}
        className="h-9 rounded-md border border-[#1e3a5f] bg-[#071428]/80 pl-7 pr-2 text-xs text-gray-300 outline-none transition-colors hover:border-sky-500/50 hover:text-white"
      >
        {locales.map((item) => (
          <option key={item} value={item} className="bg-[#050d1a] text-white">
            {localeLabels[item]}
          </option>
        ))}
      </select>
    </label>
  );
}
