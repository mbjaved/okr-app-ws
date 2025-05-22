'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if we're not already loading
    if (status === 'unauthenticated') {
      console.log('No active session, redirecting to login');
      router.push('/login');
    } else if (status === 'authenticated') {
      console.log(`User ${session?.user?.email} authenticated, redirecting to dashboard`);
      router.push('/dashboard');
    }
  }, [status, router, session]);

  // Show a loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // This will be shown very briefly before the redirect happens
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
