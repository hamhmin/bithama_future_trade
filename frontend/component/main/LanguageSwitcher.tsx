"use client";

import { localeCookieName, localeLabels, locales, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher({
  locale,
  label,
}: {
  locale: Locale;
  label: string;
}) {
  const handleChange = (nextLocale: Locale) => {
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
    window.location.href = `/${nextLocale}`;
  };

  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <select
        value={locale}
        onChange={(event) => handleChange(event.target.value as Locale)}
        aria-label={label}
        className="h-9 rounded-md border border-[#1e3a5f] bg-[#071428]/80 px-2 text-xs text-gray-300 outline-none transition-colors hover:border-sky-500/50 hover:text-white"
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
