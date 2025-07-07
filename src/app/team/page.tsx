'use client';
// Teams Page - Implements Radix UI Table per design prompt
// Best Practice: Follows UI/UX and accessibility guidelines from Design_Prompts

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import useSWR, { mutate } from "swr";

import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import Avatar from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
// Pagination size constant
const PAGE_SIZE = 8;

// Simple toast utility (replace with your own Toast if available)
function toast(msg: string, isError?: boolean) {
  if (window && window.alert) window.alert(msg);
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

// Define a User type for filtering and sorting
interface User {
  _id: string;
  username?: string;
  name?: string;
  email?: string;
  department?: string;
  role?: string;
  okrsCount?: number;
  [key: string]: any;
}

function TeamPage() {
  const { data: session, status } = useSession();

  // Manage Users mode (selection mode)
  const [manageMode, setManageMode] = React.useState(false);

  // Bulk selection state
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);

  // Handler for toggling a single user's selection
  function handleToggleUser(userId: string) {
    setSelectedUserIds(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  }

  // Handler for clearing selection (e.g., after bulk action)
  function clearSelection() {
    setSelectedUserIds([]);
  }

  const [bulkLoading, setBulkLoading] = React.useState(false);

  const { data: teams, error, isLoading } = useSWR("/api/users", fetcher);
  // Pagination state
  const [page, setPage] = React.useState(1);

  // Search/filter state
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  React.useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Side drawer for filters (Design_Prompts)
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);

  // Get unique departments and roles from user data
  const departmentOptions = React.useMemo(() => {
    if (!teams) return [];
    const set = new Set<string>();
    teams.forEach((u: User) => { if (u.department) set.add(u.department); });
    return Array.from(set).filter(Boolean).sort();
  }, [teams]);
  const roleOptions = React.useMemo(() => {
    if (!teams) return [];
    const set = new Set<string>();
    teams.forEach((u: User) => { if (u.role) set.add(u.role); });
    return Array.from(set).filter(Boolean).sort();
  }, [teams]);

  // Sorting state (Best Practice: modular, accessible, per Design_Prompts)
  const [sortKey, setSortKey] = React.useState<'username' | 'okrsCount' | ''>('');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  // Sorting handler
  function handleSort(key: 'username' | 'okrsCount') {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }

  // Filtering by department and role (Design_Prompts, modular, defensive)
  let filteredTeams = teams
    ? teams.filter((user: User) => {
        // Department filter
        if (selectedDepartments.length > 0 && !selectedDepartments.includes(user.department || "")) return false;
        // Role filter
        if (selectedRoles.length > 0 && !selectedRoles.includes(user.role || "")) return false;
        // Search filter
        const q = debouncedSearch.trim().toLowerCase();
        return (
          !q ||
          user.username?.toLowerCase().includes(q) ||
          user.name?.toLowerCase().includes(q) ||
          user.email?.toLowerCase().includes(q)
        );
      })
    : [];

  // Sorting logic (modular, defensive)
  if (sortKey) {
    filteredTeams = [...filteredTeams].sort((a: User, b: User) => {
      if (sortKey === 'username') {
        const aVal = a.username?.toLowerCase() || '';
        const bVal = b.username?.toLowerCase() || '';
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      } else if (sortKey === 'okrsCount') {
        const aVal = typeof a.okrsCount === 'number' ? a.okrsCount : 0;
        const bVal = typeof b.okrsCount === 'number' ? b.okrsCount : 0;
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }

  const totalTeams = filteredTeams.length;
  const totalPages = Math.ceil(totalTeams / PAGE_SIZE);
  const paginatedTeams = filteredTeams.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Only allow bulk actions for Admin users
  const isAdmin = session?.user?.role === 'Admin';

  return (
    <main className="bg-[#FAFAFB] min-h-screen py-8 px-2 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto w-full">
        {/* Header: Title and Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
          <div className="flex flex-row gap-2 items-center w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full sm:w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              aria-label="Search users"
            />
            <button
              type="button"
              className="flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open filters"
            >
              <svg className="h-4 w-4 mr-1 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0013 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 017 17v-3.586a1 1 0 00-.293-.707L3.293 6.707A1 1 0 013 6V4z" /></svg>
              Filters
            </button>
            {isAdmin && !manageMode && (
              <button
                type="button"
                className="flex items-center px-3 py-2 border border-blue-400 text-blue-700 bg-white rounded-lg text-sm font-semibold hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 active:bg-blue-100 cursor-pointer transition-colors"
                onClick={() => setManageMode(true)}
                aria-label="Manage Users"
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m3-4a4 4 0 110-8 4 4 0 010 8zm6 4a4 4 0 10-8 0" /></svg>
                Manage Users
              </button>
            )}
            {isAdmin && manageMode && (
              <button
                type="button"
                className="flex items-center px-3 py-2 border border-gray-400 text-gray-700 bg-gray-100 rounded-lg text-sm font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                onClick={() => { setManageMode(false); setSelectedUserIds([]); }}
                aria-label="Cancel Manage Users"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
        {error && (
          <div className="flex items-center gap-2 p-6 bg-red-50 border border-red-200 rounded text-red-700" role="alert">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Failed to load team data.</span>
          </div>
        )}
        {!isLoading && !error && paginatedTeams.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <svg className="h-10 w-10 mb-2 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 15h8M9 9h.01M15 9h.01" /></svg>
            <span>No team members yet. Invite your first user!</span>
          </div>
        )}
        {!isLoading && !error && paginatedTeams.length > 0 && (
          <div className="relative">
            {/* Sticky/fixed bulk actions toolbar at bottom */}
            {isAdmin && manageMode && selectedUserIds.length > 0 && (
              <div
                className="fixed left-0 right-0 z-30 flex flex-row items-center gap-2 bg-white/95 shadow-2xl px-6 py-3 border-t border-blue-200 animate-fade-in transition-all duration-200 max-w-6xl mx-auto rounded-lg"
                style={{margin: '0 auto', bottom: '2rem'}}
                role="toolbar"
                aria-label="Bulk user actions"
              >
                <span className="text-blue-700 font-semibold mr-4">{selectedUserIds.length} selected</span>
                <button
                  className="px-3 py-1 rounded bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
                  type="button"
                  tabIndex={0}
                  onClick={() => {/* TODO: assign role logic */}}
                >Assign Role</button>
                <button
                  className="px-3 py-1 rounded bg-yellow-400 text-gray-900 font-medium hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-colors cursor-pointer"
                  type="button"
                  tabIndex={0}
                  onClick={() => {/* TODO: deactivate logic */}}
                >Deactivate</button>
                <button
                  className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors cursor-pointer"
                  type="button"
                  tabIndex={0}
                  onClick={() => {/* TODO: reset password logic */}}
                >Reset Password</button>
                <button
                  className="ml-auto px-3 py-1 rounded bg-white border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
                  type="button"
                  tabIndex={0}
                  onClick={() => setSelectedUserIds([])}
                >Clear</button>
                <button
                  className="px-3 py-1 rounded bg-blue-100 border border-blue-300 text-blue-700 font-semibold ml-2 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
                  type="button"
                  tabIndex={0}
                  onClick={() => { setManageMode(false); setSelectedUserIds([]); }}
                >Done</button>
              </div>
            )}
            <Card className="relative">
              <Table>

                <TableHead>
                  <TableRow>
                    {isAdmin && manageMode && (
                      <TableCell className="w-8">
                        {/* Header checkbox for select all (optional) */}
                      </TableCell>
                    )}
                    <TableCell className="w-24 font-semibold text-gray-700">Profile</TableCell>
                    <TableCell className="w-40 font-semibold text-gray-700">Username</TableCell>
                    <TableCell className="w-48 font-semibold text-gray-700">Name</TableCell>
                    <TableCell className="w-64 font-semibold text-gray-700">Email</TableCell>
                    <TableCell className="w-40 font-semibold text-gray-700">Department</TableCell>
                    <TableCell className="w-32 font-semibold text-gray-700">Role</TableCell>
                    <TableCell className="w-16 font-semibold text-gray-700">OKRs</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedTeams.map((user: User) => (
                    <TableRow key={user._id}>
                      {isAdmin && manageMode && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user._id)}
                            onChange={() => handleToggleUser(user._id)}
                            aria-label={`Select user ${user.username || user.email}`}
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Avatar
                          src={user.avatarUrl}
                          alt={user.name || user.username || user.email}
                          size="sm"
                          username={user.username || user.name || user.email || '?'}
                        />
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{user.okrsCount ?? 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="flex justify-end items-center gap-2 px-6 py-4" aria-label="Pagination">
                <button
                  className={`px-3 py-1 rounded border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white hover:bg-gray-100 cursor-pointer"}`}
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`px-3 py-1 rounded border text-sm font-semibold ${
                      page === i + 1
                        ? "bg-blue-600 text-white cursor-not-allowed"
                        : "bg-white hover:bg-gray-50 text-blue-600 cursor-pointer"
                    }`}
                    onClick={() => setPage(i + 1)}
                    aria-current={page === i + 1 ? "page" : undefined}
                    disabled={page === i + 1}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className={`px-3 py-1 rounded border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                    page === totalPages
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-white hover:bg-gray-100 cursor-pointer"
                  }`}
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

export default TeamPage;
