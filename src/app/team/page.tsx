'use client';
// Teams Page - Implements Radix UI Table per design prompt
// Best Practice: Follows UI/UX and accessibility guidelines from Design_Prompts

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import useSWR from "swr";

import { Table, TableHead, TableRow, TableCell, TableBody } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const PAGE_SIZE = 8;

const fetcher = (url: string) => fetch(url).then(res => res.json());

import { redirect } from 'next/navigation';

export default function TeamPage() {
  const { data: session, status } = useSession();

  // If loading, optionally show a spinner (optional UX improvement)
  if (status === 'loading') {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }
  // If not authenticated, redirect to /login
  if (!session) {
    redirect('/login');
    return null;
  }
  const sessionUserId = session?.user?._id;

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
    teams.forEach((u: any) => { if (u.department) set.add(u.department); });
    return Array.from(set).filter(Boolean).sort();
  }, [teams]);
  const roleOptions = React.useMemo(() => {
    if (!teams) return [];
    const set = new Set<string>();
    teams.forEach((u: any) => { if (u.role) set.add(u.role); });
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
    ? teams.filter(user => {
        // Department filter
        if (selectedDepartments.length > 0 && !selectedDepartments.includes(user.department)) return false;
        // Role filter
        if (selectedRoles.length > 0 && !selectedRoles.includes(user.role)) return false;
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
    filteredTeams = [...filteredTeams].sort((a, b) => {
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

  return (
      <>
        <main className="bg-[#FAFAFB] min-h-screen p-8">
        {/* Teams Page Header & Actions
          - Follows Design_Prompts: Card layout, prominent Add User button (top-right), space for search
          - Best Practice: Visual hierarchy, accessibility, modularity */}
        <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <h1 className="text-3xl font-bold">Team</h1>
          <div className="flex gap-2 items-center">
            {/* Filter button opens side drawer (Design_Prompts) */}
            <button
              className="border border-gray-300 bg-white hover:bg-gray-100 px-3 py-1 rounded text-sm font-medium flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Open filters"
              onClick={() => setDrawerOpen(true)}
              type="button"
            >
              <span>Filters</span>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" stroke="#0071E1" strokeWidth="2" strokeLinecap="round"/></svg>
            </button>
            {/* Search input for filtering users by username or email */}
            <input
              type="search"
              className="border rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Search users..."
              aria-label="Search users"
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: 180 }}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded shadow focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
              aria-label="Add User"
              // onClick={handleAddUser}
            >
              Add User
            </button>
          </div>
        </div>

        {/* Filter chips (Design_Prompts) */}
        {(selectedDepartments.length > 0 || selectedRoles.length > 0) && (
          <div className="flex flex-wrap gap-2 mb-2" aria-label="Active filters">
            {selectedDepartments.map(dep => (
              <span key={dep} className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm">
                <span>{dep}</span>
                <button
                  aria-label={`Remove department filter ${dep}`}
                  className="ml-2 text-gray-600 hover:text-red-600 focus:outline-none"
                  onClick={() => setSelectedDepartments(selectedDepartments.filter(d => d !== dep))}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
            {selectedRoles.map(role => (
              <span key={role} className="flex items-center bg-gray-200 rounded-full px-3 py-1 text-sm">
                <span>{role}</span>
                <button
                  aria-label={`Remove role filter ${role}`}
                  className="ml-2 text-gray-600 hover:text-red-600 focus:outline-none"
                  onClick={() => setSelectedRoles(selectedRoles.filter(r => r !== role))}
                  type="button"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}

          {/* Error State: Accessible alert */}
          {error && (
            <div className="flex items-center gap-2 p-6 bg-red-50 border border-red-200 rounded text-red-700" role="alert">
              <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span>Failed to load team data.</span>
            </div>
          )}

          {/* Empty State: Friendly message */}
          {!isLoading && !error && paginatedTeams.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-gray-500">
              <svg className="h-10 w-10 mb-2 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 15h8M9 9h.01M15 9h.01" /></svg>
              <span>No team members yet. Invite your first user!</span>
            </div>
          )}

          {/* Table State */}
          {!isLoading && !error && paginatedTeams.length > 0 && (
            <>
              <Table>
                <TableHead>
                <TableRow>
                  {/* Sortable Username column */}
                  <TableCell>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-sort={sortKey === 'username' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                      aria-label={`Sort by Username ${sortKey === 'username' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : ''}`}
                      onClick={() => handleSort('username')}
                    >
                      Username
                      {sortKey === 'username' && (
                        <span aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Designation</TableCell>
                  {/* Sortable OKR Count column */}
                  <TableCell>
                    <button
                      type="button"
                      className="flex items-center gap-1 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
                      aria-sort={sortKey === 'okrsCount' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                      aria-label={`Sort by OKR Count ${sortKey === 'okrsCount' ? (sortDirection === 'asc' ? 'descending' : 'ascending') : ''}`}
                      onClick={() => handleSort('okrsCount')}
                    >
                      OKR Count
                      {sortKey === 'okrsCount' && (
                        <span aria-hidden="true">{sortDirection === 'asc' ? '▲' : '▼'}</span>
                      )}
                    </button>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTeams.map((user: any) => (
                  <TableRow key={user._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar src={user.avatarUrl} username={user.username} alt={user.username} size="sm" />
                        <Link
                          href={user._id === sessionUserId ? "/settings/profile" : `/profile/${encodeURIComponent(user.username)}`}
                          className="text-[#0071E1] hover:underline font-medium focus:outline-none"
                          aria-label={`View profile for ${user.username}`}
                        >
                          {user.username}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        color={user.role === "Admin" ? "green" : "gray"}
                        className={user.role === "Admin" ? "bg-green-100 text-green-800 border border-green-400" : "bg-gray-100 text-gray-800 border border-gray-300"}
                      >
                        <span title={user.role === "Admin" ? "Administrator" : "Standard User"}>
                          {user.role}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.designation}</TableCell>
                    <TableCell>{user.okrsCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="flex justify-end items-center gap-2 px-6 py-4" aria-label="Pagination">
                <button
                  className="px-3 py-1 rounded border text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i + 1}
                    className={`px-3 py-1 rounded border text-sm font-medium ${page === i + 1 ? 'bg-blue-600 text-white' : 'bg-white hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                    onClick={() => setPage(i + 1)}
                    aria-current={page === i + 1 ? 'page' : undefined}
                    aria-label={`Page ${i + 1}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="px-3 py-1 rounded border text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-400"
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </div>
    </main>
    {drawerOpen && (
      <>
        {/* Overlay: covers the whole viewport, dims but allows click-through to close */}
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-30 transition-opacity duration-200"
          aria-hidden="true"
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className="fixed inset-y-0 right-0 z-50 w-80 bg-white h-full shadow-xl p-6 flex flex-col gap-4 animate-slide-in-right"
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold">Filter Team</h2>
            <button
              aria-label="Close filters"
              className="text-gray-600 hover:text-red-600 focus:outline-none"
              onClick={() => setDrawerOpen(false)}
              type="button"
            >
              ×
            </button>
          </div>
          <div>
            <h3 className="font-medium mb-1">Department</h3>
            {departmentOptions.length === 0 && <div className="text-gray-400 text-sm">No departments found</div>}
            <div className="flex flex-col gap-1">
              {departmentOptions.map(dep => (
                <label key={dep} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedDepartments.includes(dep)}
                    onChange={e => {
                      setSelectedDepartments(e.target.checked
                        ? [...selectedDepartments, dep]
                        : selectedDepartments.filter(d => d !== dep));
                    }}
                    aria-label={`Filter by department ${dep}`}
                    className="accent-blue-600"
                  />
                  <span>{dep}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-medium mb-1">Role</h3>
            {roleOptions.length === 0 && <div className="text-gray-400 text-sm">No roles found</div>}
            <div className="flex flex-col gap-1">
              {roleOptions.map(role => (
                <label key={role} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={e => {
                      setSelectedRoles(e.target.checked
                        ? [...selectedRoles, role]
                        : selectedRoles.filter(r => r !== role));
                    }}
                    aria-label={`Filter by role ${role}`}
                    className="accent-blue-600"
                  />
                  <span>{role}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="button"
              aria-label="Apply filters"
              onClick={() => setDrawerOpen(false)}
            >
              Apply
            </button>
            <button
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
              type="button"
              aria-label="Cancel and reset filters"
              onClick={() => {
                setSelectedDepartments([]); setSelectedRoles([]); setDrawerOpen(false);
              }}
            >
              Reset
            </button>
          </div>
        </aside>
      </>
    )}
  </>
  );
}
