import { headers } from "next/headers";
import { getLocale } from "@/lib/i18n";
import { translateRuntimeText } from "@/lib/runtimeTranslations";

export async function generateMetadata() {
  const requestHeaders = await headers();
  const locale = getLocale(requestHeaders.get("x-bithama-locale") ?? undefined);

  return {
    title: `${translateRuntimeText(locale, "거래소")} | BITHAMA`,
  };
}

export default function FutureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
