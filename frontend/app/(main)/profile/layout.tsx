import { headers } from "next/headers";
import { getLocale } from "@/lib/i18n";
import { translateRuntimeText } from "@/lib/runtimeTranslations";

export async function generateMetadata() {
  const requestHeaders = await headers();
  const locale = getLocale(requestHeaders.get("x-bithama-locale") ?? undefined);

  return {
    title: `${translateRuntimeText(locale, "프로필")} | BITHAMA`,
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
