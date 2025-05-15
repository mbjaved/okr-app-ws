// User Profile Page for viewing other users by ID
// Best Practice: Accessibility, modularity, minimal payload, robust UI feedback, design prompt reference

import { notFound } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UserProfileProps {
  params: { id: string };
}

async function fetchUserByUsername(username: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/users/username/${encodeURIComponent(username)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('User not found');
  return res.json();
}

export default async function UserProfilePage({ params }: UserProfileProps) {
  // Await params if needed (for edge compatibility)
  const username = typeof params.username === 'string' ? params.username : Array.isArray(params.username) ? params.username[0] : '';
  let user: any = null;
  let error = '';
  try {
    user = await fetchUserByUsername(username);
  } catch (err: any) {
    error = err.message || 'User not found';
  }

  if (!user || error) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#FAFAFB]">
        <Card className="max-w-lg w-full p-8 flex flex-col items-center gap-4 bg-white border border-red-200">
          <span className="text-2xl text-red-700 font-bold">User Not Found</span>
          <span className="text-red-500 text-sm">{error}</span>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-[#FAFAFB]">
      <Card className="max-w-lg w-full p-8 flex flex-col items-center gap-4 bg-white">
        <Avatar src={user.avatarUrl} username={user.username} alt={user.username} size="lg" />
        <h1 className="text-3xl font-bold">{user.username}</h1>
        <div className="flex gap-2">
          <Badge color={user.role === 'Admin' ? 'green' : 'gray'} className={user.role === 'Admin' ? 'bg-green-100 text-green-800 border border-green-400' : 'bg-gray-100 text-gray-800 border border-gray-300'}>
            <span title={user.role === 'Admin' ? 'Administrator' : 'Standard User'}>{user.role}</span>
          </Badge>
        </div>
        <div className="flex flex-col gap-1 w-full text-center">
          <span className="text-gray-700 font-semibold">{user.name}</span>
          <span className="text-gray-500">{user.email}</span>
          <span className="text-gray-500">Department: {user.department}</span>
          <span className="text-gray-500">Designation: {user.designation}</span>
          <span className="text-gray-500">OKRs: {user.okrsCount}</span>
        </div>
      </Card>
    </main>
  );
}
