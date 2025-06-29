
import { redirect } from 'next/navigation';

export default function RootPage() {
  // This page now simply redirects to the main landing page,
  // which is now located at /home. Or, you could redirect to /login.
  // We will redirect to the dashboard for an authenticated-first experience.
  redirect('/dashboard');
}
