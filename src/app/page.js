import { redirect } from 'next/navigation';

export default function Home() {
  // Instantly reroute all root traffic to the client login portal
  redirect('/client-login');
}