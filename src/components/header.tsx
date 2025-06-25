import { CricketIcon } from '@/components/icons/cricket-icon';
import Link from 'next/link';

export function Header() {
  return (
    <header className="bg-card border-b shadow-sm">
      <div className="container mx-auto flex items-center h-16 px-4">
        <Link href="/" className="flex items-center gap-2 text-foreground">
          <CricketIcon className="h-6 w-6 text-primary" />
          <span className="text-xl font-bold">SCRBRD-Beta-3</span>
        </Link>
      </div>
    </header>
  );
}
