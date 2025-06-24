"use client";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import TopNav from "../components/TopNav";

interface ClientLayoutProps {
  children: React.ReactNode;
  session: Session | null;
}

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function ClientLayout({ children, session }: ClientLayoutProps) {

  const pathname = usePathname();
  const searchParams = useSearchParams();



  return (
    <SessionProvider session={session}>
      <TopNav />
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname + searchParams.toString()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="pt-16 min-h-screen"
        >
          {children}
        </motion.div>
      </AnimatePresence>

    </SessionProvider>
  );
}
