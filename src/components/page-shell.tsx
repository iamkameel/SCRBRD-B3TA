import { Sidebar } from './sidebar';
import { Header } from './header';

export default function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
        <Sidebar />
        <div className="flex flex-col flex-1 md:pl-64">
            <Header />
            <main className="flex-1 bg-background p-4 md:p-8">
            {children}
            </main>
        </div>
    </div>
  );
}
