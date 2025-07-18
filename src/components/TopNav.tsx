import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, MenuItem } from "./ui/Menu";
import Avatar from "./ui/avatar";
import { NotificationBell } from "./ui/NotificationBell";
import { useSession, signOut } from "next-auth/react";

// You can replace this with your mascot/logo as needed
const Logo = () => (
  <span className="flex items-center gap-2 font-bold text-xl text-[#0071E1]">
    <span role="img" aria-label="mascot">🤖</span> OKR Tracker
  </span>
);

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/okrs", label: "OKRs" },
  { href: "/team", label: "Teams" },
  { href: "/reports", label: "Reports" },
];

const TopNav: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Best_Practices.md: Only show nav links/avatar if authenticated
  const isAuthenticated = status === 'authenticated' && !!session;
  // Fix: The login page is at '/login', not '/auth/login'.
  const isLoginPage = pathname === '/login';

  if (!isAuthenticated) {
    return (
      <nav
        className="fixed top-0 left-0 w-full z-50 bg-white shadow-xl border-b border-gray-100 px-6 py-3 flex items-center justify-between"
        role="navigation"
        aria-label="Main navigation"
      >
        <Logo />
        {/* Best_Practices.md: Show login button if not on login page for accessibility */}
        {!isLoginPage && (
          <button
            className="ml-auto px-4 py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
            onClick={() => router.push('/login')}
          >
            Login
          </button>
        )}
      </nav>
    );
  }

  // Navigation link checker (could add more robust logic if needed)
  const isActive = (href: string) => {
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 bg-white shadow-xl border-b border-gray-100 px-6 py-3 flex items-center justify-between"
      role="navigation"
      aria-label="Main navigation"
    >
      <Logo />
      {/* Desktop nav links */}
      <div className="hidden md:flex gap-4 ml-8">
        {navLinks.map(link => (
          <Link
            key={link.href}
            href={link.href}
            tabIndex={0}
            className={`px-3 py-2 rounded text-base font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 hover:bg-[#F0F6FA] hover:text-[#0071E1] ${
              isActive(link.href) ? "text-[#0071E1] bg-[#F0F6FA] font-semibold shadow-sm" : "text-[#000C2C]"
            }`}
            aria-current={isActive(link.href) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </div>
      {/* Notifications and User Menu */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <NotificationBell />
        
        {/* User Menu */}
        <Menu
          trigger={
            <span aria-label="Open user menu" tabIndex={0} className="outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
              <Avatar
                size="sm"
                username={
                  (session?.user && 'username' in session.user && typeof session.user.username === 'string')
                    ? session.user.username
                    : session?.user?.email?.split("@")[0]
                }
                src={
                  (session?.user && 'avatarUrl' in session.user && typeof session.user.avatarUrl === 'string')
                    ? session.user.avatarUrl
                    : session?.user?.image || undefined
                }
                alt={session?.user?.name || session?.user?.email || "User"}
              />
            </span>
          }
        >
          <MenuItem onClick={() => router.push('/settings/profile')}>
            <span className="flex items-center gap-2">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" stroke="#0071E1" strokeWidth="2"/><path d="M4 20c0-2.21 3.582-4 8-4s8 1.79 8 4" stroke="#0071E1" strokeWidth="2"/></svg>
              Profile
            </span>
          </MenuItem>
          <MenuItem onClick={() => router.push('/settings')}>
            <span className="flex items-center gap-2">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3" stroke="#0071E1" strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 8.6 15a1.65 1.65 0 0 0-1.82-.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 15.4 9c.26.5.26 1.1 0 1.6z" stroke="#0071E1" strokeWidth="2"/></svg>
              Settings
            </span>
          </MenuItem>
          <MenuItem onClick={() => {
            // Prevent hook-order violations by separating signOut and navigation into distinct operations
            // First, initiate auth state change
            signOut({ redirect: false })
              .then(() => {
                // Then use a safer timeout to ensure React completes current render cycle
                // This prevents hook-order violations during component teardown
                setTimeout(() => {
                  // Use replace instead of push to prevent back-navigation after logout
                  router.replace('/login');
                }, 50); // Slightly longer delay for more reliable cleanup
              });
          }}>
            <span className="flex items-center gap-2">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 17l5-5m0 0l-5-5m5 5H9" stroke="#FF2538" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="4" width="6" height="16" rx="2" stroke="#FF2538" strokeWidth="2"/></svg>
              <span className="text-[#FF2538]">Logout</span>
            </span>
          </MenuItem>
        </Menu>
      </div>
      {/* Mobile hamburger */}
      <div className="md:hidden">
        <button
          className="w-10 h-10 flex items-center justify-center rounded bg-[#F0F6FA] border border-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="Open navigation menu"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="#0071E1" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
        {/* Mobile nav drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 bg-black bg-opacity-30 flex justify-end"
            tabIndex={-1}
            aria-modal="true"
            role="dialog"
            onClick={() => setMobileOpen(false)}
          >
            <div
              className="w-64 h-full bg-white shadow-xl flex flex-col gap-2 p-6"
              onClick={e => e.stopPropagation()}
            >
              <button
                className="self-end text-gray-500 hover:text-red-500 text-2xl mb-4 outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                aria-label="Close navigation menu"
                onClick={() => setMobileOpen(false)}
              >
                ×
              </button>
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded text-lg font-medium transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 hover:bg-[#F0F6FA] hover:text-[#0071E1] ${
                    isActive(link.href) ? "text-[#0071E1] bg-[#F0F6FA] font-semibold" : "text-[#000C2C]"
                  }`}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  tabIndex={0}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNav;
