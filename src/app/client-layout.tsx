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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleBeforeUnload = () => {
      setIsRefreshing(true);
    };
    const handleLoad = () => {
      setIsRefreshing(false);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("load", handleLoad);
    window.scrollTo({ top: 0, behavior: "smooth" });
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("load", handleLoad);
    };
  }, [pathname, searchParams]);

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
      {/* Refresh Indicator */}
      <AnimatePresence>
        {isRefreshing && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center gap-2"
          >
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Updating...</span>
          </motion.div>
        )}
      </AnimatePresence>
    </SessionProvider>
  );
}
