
// This special layout removes the PageShell for public pages.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>;
}
