"use client";
import { SessionProvider } from "next-auth/react";

import TopNav from "../components/TopNav";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TopNav />
      <div className="pt-16"> {/* Add padding to offset fixed nav */}
        {children}
      </div>
    </SessionProvider>
  );
}
