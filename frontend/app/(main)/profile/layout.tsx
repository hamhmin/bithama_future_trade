// app/(main)/profile/layout.tsx
export const metadata = {
  title: "프로필 | BITHAMA",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
