import { PublicHeader } from '@/components/public-header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
    </>
  );
}
