// app/(main)/profile/layout.tsx
export const metadata = {
  title: "로그인 | BITHAMA",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
