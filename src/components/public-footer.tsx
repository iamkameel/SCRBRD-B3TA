import Link from 'next/link';

export function PublicFooter() {
  return (
    <footer className="border-t">
        <div className="container flex flex-col gap-4 py-6 text-center md:flex-row md:justify-between md:text-left">
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} SCRBRD. All rights reserved.</p>
            <nav className="flex gap-4 justify-center sm:gap-6">
            <Link href="#" className="text-xs hover:underline underline-offset-4">
                Terms of Service
            </Link>
            <Link href="#" className="text-xs hover:underline underline-offset-4">
                Privacy Policy
            </Link>
            </nav>
        </div>
    </footer>
  );
}
