
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/logo';

export function PublicHeader() {
  return (
    <header className="bg-background/95 backdrop-blur-sm sticky top-0 z-50 border-b">
      <div className="container flex h-14 items-center">
        <Link href="/home" className="flex items-center justify-center">
            <Logo />
            <span className="sr-only">SCRBRD</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
            <Link href="#features" className="text-sm font-medium hover:underline underline-offset-4">
            Features
            </Link>
            <Button asChild variant="outline">
                <Link href="/login">Log In</Link>
            </Button>
            <Button asChild>
                <Link href="/signup">Sign Up</Link>
            </Button>
        </nav>
      </div>
    </header>
  );
}
