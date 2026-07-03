import { NextRequest, NextResponse } from "next/server";
import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n";

const PUBLIC_FILE = /\.(.*)$/;

function detectFromCountry(country: string | null): Locale | null {
  if (!country) return null;

  const code = country.toUpperCase();
  if (code === "KR") return "ko";
  if (code === "JP") return "ja";
  return "en";
}

function detectFromAcceptLanguage(value: string | null): Locale | null {
  if (!value) return null;

  const languages = value
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const language of languages) {
    const base = language.split("-")[0];
    if (isLocale(base)) return base;
  }

  return null;
}

function detectLocale(request: NextRequest): Locale {
  const savedLocale = request.cookies.get(localeCookieName)?.value;
  if (isLocale(savedLocale)) return savedLocale;

  const countryLocale = detectFromCountry(
    request.headers.get("cf-ipcountry") ??
      request.headers.get("x-vercel-ip-country"),
  );
  if (countryLocale) return countryLocale;

  return (
    detectFromAcceptLanguage(request.headers.get("accept-language")) ??
    defaultLocale
  );
}

function responseWithLocale(request: NextRequest, locale: Locale) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-bithama-locale", locale);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  response.cookies.set(localeCookieName, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
  });

  return response;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const firstSegment = pathname.split("/")[1];
  if (isLocale(firstSegment)) {
    return responseWithLocale(request, firstSegment);
  }

  const locale = detectLocale(request);
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}`;
    const response = NextResponse.redirect(url);
    response.cookies.set(localeCookieName, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
      sameSite: "lax",
    });
    return response;
  }

  return responseWithLocale(request, locale);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
