// User Profile Page for viewing other users by ID
// Best Practice: Accessibility, modularity, minimal payload, robust UI feedback, design prompt reference

import { notFound } from 'next/navigation';
import Avatar from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Use the specific props type expected by Next.js for dynamic route parameters


// Helper fetch by ID (update this function as needed)
async function fetchUserById(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/users/${encodeURIComponent(id)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('User not found');
  return res.json();
}

export default async function UserProfilePage({ params, searchParams }: { params: { id: string }, searchParams?: Record<string, string | string[] | undefined> }) {
  // Use id param directly for fetching
  const userId = params.id;
  let user: any = null;
  let error = '';
  try {
    user = await fetchUserById(userId);
  } catch (err: any) {
    error = err.message || 'User not found';
  }

  // Always render the same hook tree, don't return early before hooks (if any are used)
  // If you need to show a not found UI, do so after all hooks

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#FAFAFB]">
      <Card className="w-full max-w-md p-8 flex flex-col items-center gap-4">
        {(!user || error) ? (
          <div className="text-center text-red-500">{error || 'User not found'}</div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar src={user?.avatarUrl || undefined} alt={user?.name || 'User'} size="lg" />
              <Badge color={user?.active !== false ? 'green' : 'red'}>{user?.active !== false ? 'Active' : 'Inactive'}</Badge>
            </div>
            <div className="flex flex-col gap-1 w-full text-center">
              <span className="text-gray-700 font-semibold">{user?.name || 'Unknown User'}</span>
              <span className="text-gray-500">{user?.email || ''}</span>
              <span className="text-gray-500">Department: {user?.department || ''}</span>
              <span className="text-gray-500">Designation: {user?.designation || ''}</span>
              <span className="text-gray-500">OKRs: {user?.okrsCount ?? 0}</span>
            </div>
          </>
        )}
      </Card>
    </main>
  );
}
