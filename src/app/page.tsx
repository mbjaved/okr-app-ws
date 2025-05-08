import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/authOptions";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/auth/login');
  }
  // Redirect authenticated users to the dashboard (e.g., /okrs or /dashboard)
  redirect('/okrs'); // Change to '/dashboard' if you have a dashboard route
  return null;
}
