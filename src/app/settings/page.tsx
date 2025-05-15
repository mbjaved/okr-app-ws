'use client';
// src/app/settings/page.tsx
// Best Practice: Accessible, modular, settings landing page placeholder
import React from "react";
import Link from "next/link";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const SettingsPage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  if (status === 'loading') return <div>Loading...</div>;
  if (!session) {
    router.replace('/login');
    return null;
  }
  return (
    <main className="max-w-lg mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <ul className="space-y-4">
        <li>
          <Link href="/settings/profile" className="text-blue-600 hover:underline font-medium">
            Profile Settings
          </Link>
        </li>
        {/* Add more settings links here */}
      </ul>
    </main>
  );
};

export default SettingsPage;
