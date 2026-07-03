"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { defaultLocale, localeCookieName, type Locale } from "@/lib/i18n";
import {
  hasRuntimeTranslation,
  translateRuntimeText,
} from "@/lib/runtimeTranslations";

type I18nContextValue = {
  locale: Locale;
  translate: (value: string) => string;
};

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  translate: (value) => value,
});

const ignoredTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA"]);
const translatableAttributes = ["placeholder", "title", "aria-label"];

function translateNode(locale: Locale, node: Node) {
  if (locale === "ko") return;

  if (node.nodeType === Node.TEXT_NODE) {
    const current = node.textContent ?? "";
    if (hasRuntimeTranslation(locale, current)) {
      node.textContent = translateRuntimeText(locale, current);
    }
    return;
  }

  if (!(node instanceof HTMLElement) || ignoredTags.has(node.tagName)) {
    return;
  }

  for (const attribute of translatableAttributes) {
    const value = node.getAttribute(attribute);
    if (value && hasRuntimeTranslation(locale, value)) {
      node.setAttribute(attribute, translateRuntimeText(locale, value));
    }
  }

  for (const child of Array.from(node.childNodes)) {
    translateNode(locale, child);
  }
}

export function useI18n() {
  return useContext(I18nContext);
}

export default function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: ReactNode;
}) {
  const value = useMemo(
    () => ({
      locale,
      translate: (text: string) => translateRuntimeText(locale, text),
    }),
    [locale],
  );

  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `${localeCookieName}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    localStorage.setItem(localeCookieName, locale);
  }, [locale]);

  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      if (typeof input !== "string" && !(input instanceof URL)) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers);
      headers.set("x-bithama-locale", locale);
      headers.set("accept-language", locale);

      return originalFetch(input, {
        ...init,
        headers,
      });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [locale]);

  useEffect(() => {
    translateNode(locale, document.body);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of Array.from(mutation.addedNodes)) {
          translateNode(locale, node);
        }

        if (
          mutation.type === "characterData" &&
          mutation.target.nodeType === Node.TEXT_NODE
        ) {
          translateNode(locale, mutation.target);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
