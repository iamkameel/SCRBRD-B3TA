
import { redirect } from 'next/navigation';

export default function RootPage() {
  // This page now simply redirects to the main landing page,
  // which is now located at /home.
  redirect('/home');
}
