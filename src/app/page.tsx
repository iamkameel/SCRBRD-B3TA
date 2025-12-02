import { redirect } from 'next/navigation';

export default function RootPage() {
  // Authentication is disabled. Redirect directly to the dashboard.
  redirect('/dashboard');
}
