import { MetadataRoute } from "next";
import { getAlternateLanguages, locales, siteUrl } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const localizedLandingPages = locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: locale === "ko" ? 1 : 0.9,
    alternates: {
      languages: getAlternateLanguages(),
    },
  }));

  return [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
      alternates: {
        languages: getAlternateLanguages(),
      },
    },
    ...localizedLandingPages,
    {
      url: `${siteUrl}/future`,
      lastModified: new Date(),
      changeFrequency: "always",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${siteUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
