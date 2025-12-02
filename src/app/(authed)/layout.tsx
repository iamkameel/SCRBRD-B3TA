
import PageShell from '@/components/page-shell';

export default function AuthedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <PageShell>{children}</PageShell>;
}
