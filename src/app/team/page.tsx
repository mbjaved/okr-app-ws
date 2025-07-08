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
import { TeamUserMenu } from "@/components/okr/TeamUserMenu";
import { AssignRoleModal } from "@/components/okr/AssignRoleModal";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { TeamFilters } from "@/components/ui/TeamFilters";
import { InviteUsersModal } from "./InviteUsersModal";
import { InviteUsersButton } from "./InviteUsersButton";
// Pagination size constant
const PAGE_SIZE = 8;

import Toast from "@/components/ui/Toast";


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
  active?: boolean; // Added: user is active (default true)
  [key: string]: any;
}

type BulkActionType = 'activate' | 'deactivate' | 'resetPw' | null;

function TeamPage() {
  // --- ActionsMenu handlers ---
  const [assignRoleOpen, setAssignRoleOpen] = React.useState(false);

  // Get current user id from session
  const { data: session } = useSession();
  const currentUserId = session?.user?.id || session?.user?._id || null;
  const [assignRoleUser, setAssignRoleUser] = React.useState<User | null>(null);
  const [assignRoleLoading, setAssignRoleLoading] = React.useState(false);

  function handleAssignRole(user: User) {
    setAssignRoleUser(user);
    setAssignRoleOpen(true);
  }

  const [confirmActivateOpen, setConfirmActivateOpen] = React.useState(false);
const [confirmActivateUser, setConfirmActivateUser] = React.useState<User | null>(null);
const [activateLoading, setActivateLoading] = React.useState(false);
const [pendingActivateAction, setPendingActivateAction] = React.useState<'activate' | 'deactivate' | null>(null);

function handleActivateDeactivate(user: User) {
  setConfirmActivateUser(user);
  setPendingActivateAction(user.active !== false ? 'deactivate' : 'activate');
  setConfirmActivateOpen(true);
}

  const [resetPwOpen, setResetPwOpen] = React.useState(false);
const [resetPwUser, setResetPwUser] = React.useState<User | null>(null);
const [resetPwLoading, setResetPwLoading] = React.useState(false);

function handleResetPassword(user: User) {
  setResetPwUser(user);
  setResetPwOpen(true);
}

  // Bulk confirm modal state
  const [bulkConfirm, setBulkConfirm] = React.useState<{ action: BulkActionType, open: boolean }>({ action: null, open: false });

  // Invite modal state
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [inviteLoading, setInviteLoading] = React.useState(false);

  // Toast state
  const [toastOpen, setToastOpen] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState("");
  const [toastType, setToastType] = React.useState<"success" | "error" | "info">("info");

  // Invite API handler
  async function handleInvite(emails: string[]) {
    setInviteLoading(true);
    try {
      const res = await fetch('/api/users/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to send invites');
      mutate('/api/users'); // Refresh user list
      const invited = result.invited || [];
      const ignored = result.ignored || [];
      if (invited.length > 0) {
        let msg = `Invites sent!`;
        if (ignored.length > 0) {
          msg += `\nIgnored (already registered): ${ignored.join(", ")}`;
        }
        setToastMsg(msg);
        setToastType('success');
        setToastOpen(true);
        setInviteOpen(false); // Close modal if at least one invite sent
      } else if (ignored.length > 0) {
        setToastMsg(`No invites sent. Already registered: ${ignored.join(", ")}`);
        setToastType('info');
        setToastOpen(true);
        // Keep modal open so user can edit
      }
    } catch (err: any) {
      setToastMsg('Failed to send invites. Please try again.');
      setToastType('error');
      setToastOpen(true);
    } finally {
      setInviteLoading(false);
    }
  }


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

  // Filter modal state (matches OKRs page advanced filter UX)
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [selectedDepartments, setSelectedDepartments] = React.useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = React.useState<string[]>([]);

  // Compute active filter count (for badge)
  const activeFilterCount = (selectedDepartments.length > 0 ? 1 : 0) + (selectedRoles.length > 0 ? 1 : 0);

  // Get unique departments and roles from user data as MultiSelectOption[]
  const departmentOptions = React.useMemo(() => {
    if (!teams) return [];
    const set = new Set<string>();
    teams.forEach((u: User) => { if (u.department) set.add(u.department); });
    return Array.from(set).filter(Boolean).sort().map((d) => ({ value: d, label: d }));
  }, [teams]);
  const roleOptions = React.useMemo(() => {
    if (!teams) return [];
    const set = new Set<string>();
    teams.forEach((u: User) => { if (u.role) set.add(u.role); });
    return Array.from(set).filter(Boolean).sort().map((r) => ({ value: r, label: r }));
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
        {/* Table and actions */}
        <AssignRoleModal
          open={assignRoleOpen}
          user={assignRoleUser}
          roleOptions={roleOptions}
          loading={assignRoleLoading}
          onClose={() => { setAssignRoleOpen(false); setAssignRoleUser(null); }}
          onAssign={async (userId, role) => {
            setAssignRoleLoading(true);
            try {
              const res = await fetch('/api/users/bulk', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userIds: [userId], action: 'assignRole', value: role })
              });
              const result = await res.json();
              if (!res.ok) throw new Error(result.error || 'Failed to assign role');
              setToastMsg('Role updated successfully');
              setToastType('success');
              setToastOpen(true);
              mutate('/api/users'); // Refresh users
              setAssignRoleOpen(false);
              setAssignRoleUser(null);
            } catch (err: any) {
              setToastMsg(err.message || 'Failed to assign role');
              setToastType('error');
              setToastOpen(true);
            } finally {
              setAssignRoleLoading(false);
            }
          }}
        />
        {/* Confirm Activate/Deactivate Modal */}
        <Modal
          open={resetPwOpen}
          onClose={() => setResetPwOpen(false)}
          title="Reset Password"
        >
          <div className="flex flex-col gap-4">
            <div>
              Are you sure you want to send a password reset email to <b>{resetPwUser?.username || resetPwUser?.email}</b>?
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="secondary" onClick={() => setResetPwOpen(false)} disabled={resetPwLoading}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!resetPwUser) return;
                  setResetPwLoading(true);
                  try {
                    const res = await fetch('/api/users/bulk', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userIds: [resetPwUser._id] })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || 'Failed to send reset email');
                    setToastMsg('Password reset email sent');
                    setToastType('success');
                    setToastOpen(true);
                    setResetPwOpen(false);
                    setResetPwUser(null);
                  } catch (err: any) {
                    setToastMsg(err.message || 'Failed to send reset email');
                    setToastType('error');
                    setToastOpen(true);
                  } finally {
                    setResetPwLoading(false);
                  }
                }}
                isLoading={resetPwLoading}
                disabled={resetPwLoading}
              >
                Send Reset Email
              </Button>
            </div>
          </div>
        </Modal>
        <Modal
          open={confirmActivateOpen}
          onClose={() => setConfirmActivateOpen(false)}
          title={pendingActivateAction === 'deactivate' ? 'Deactivate User' : 'Activate User'}
        >
          <div className="flex flex-col gap-4">
            <div>
              Are you sure you want to {pendingActivateAction === 'deactivate' ? 'deactivate' : 'activate'} user <b>{confirmActivateUser?.username || confirmActivateUser?.email}</b>?
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="secondary" onClick={() => setConfirmActivateOpen(false)} disabled={activateLoading}>Cancel</Button>
              <Button
                onClick={async () => {
                  if (!confirmActivateUser) return;
                  setActivateLoading(true);
                  try {
                    const res = await fetch('/api/users/bulk', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userIds: [confirmActivateUser._id], action: pendingActivateAction })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || 'Failed to update user');
                    setToastMsg(`User ${pendingActivateAction === 'deactivate' ? 'deactivated' : 'activated'} successfully`);
                    setToastType('success');
                    setToastOpen(true);
                    mutate('/api/users');
                    setConfirmActivateOpen(false);
                    setConfirmActivateUser(null);
                  } catch (err: any) {
                    setToastMsg(err.message || 'Failed to update user');
                    setToastType('error');
                    setToastOpen(true);
                  } finally {
                    setActivateLoading(false);
                  }
                }}
                isLoading={activateLoading}
                disabled={activateLoading}
              >
                {pendingActivateAction === 'deactivate' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        </Modal>
        {/* Header: Title and Controls */}
        <div className="flex flex-col gap-4">
          <div className="pt-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-row items-center justify-between w-full">
                <h1 className="text-2xl font-bold">Teams</h1>
                <div className="flex flex-row items-center gap-3">
                  <input
                    type="text"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm bg-white transition-all cursor-pointer"
                    placeholder="Search teams or users..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Search teams or users"
                    style={{ minWidth: 220 }}
                  />
                  <div className="flex flex-row gap-2">
                    <button
                      className="flex items-center gap-1 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 font-semibold shadow-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
                      onClick={() => setFiltersOpen(true)}
                      aria-label="Open filters"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707l-6.414 6.414A1 1 0 0014 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 018 17V13.414a1 1 0 00-.293-.707L1.293 6.707A1 1 0 011 6V4z" />
                      </svg>
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {activeFilterCount}
                        </span>
                      )}
                    </button>
                    {/* Manage Users/Cancel logic for Admins */}
                    {isAdmin && !manageMode && (
                      <button
                        type="button"
                        className="flex items-center px-3 py-2 rounded-lg border border-blue-400 text-blue-700 bg-white font-semibold shadow-sm hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 active:bg-blue-100 cursor-pointer transition-colors"
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
                        className="flex items-center px-3 py-2 rounded-lg border border-gray-400 text-gray-700 bg-gray-100 font-semibold shadow-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors cursor-pointer"
                        onClick={() => { setManageMode(false); setSelectedUserIds([]); }}
                        aria-label="Cancel Manage Users"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <hr className="mt-3 border-gray-200" />
            </div>
          </div>
        </div>
        {/* TeamFilters Modal (always render at top level of main, not inside header) */}
        <TeamFilters
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          departmentOptions={departmentOptions}
          roleOptions={roleOptions}
          selectedDepartments={selectedDepartments}
          selectedRoles={selectedRoles}
          onDepartmentsChange={setSelectedDepartments}
          onRolesChange={setSelectedRoles}
          onReset={() => { setSelectedDepartments([]); setSelectedRoles([]); }}
          onApply={() => setFiltersOpen(false)}
          activeFilterCount={activeFilterCount}
        />
        {error && (
          <div className="flex items-center gap-2 p-6 bg-red-50 border border-red-200 rounded text-red-700" role="alert">
            <svg className="h-5 w-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span>Failed to load team data.</span>
          </div>
        )}
        {!isLoading && !error && paginatedTeams.length === 0 && (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500">
            <svg className="h-10 w-10 mb-2 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" d="M8 15h8M9 9h.01M15 9h.01" /></svg>
            {isAdmin ? (
              <>
                <span>No team members yet. Invite your first user!</span>
                <div className="mt-6">
                  <InviteUsersButton onClick={() => setInviteOpen(true)} className="cursor-pointer" />
                </div>
              </>
            ) : (
              <span>No team members yet. Please contact your administrator to be invited.</span>
            )}
          </div>
        )}
        {!isLoading && !error && paginatedTeams.length > 0 && (
          <div className="relative">
            {/* Invite New User button (bottom-left, only Admin in Manage Users mode) */}

            {/* Sticky/fixed bulk actions toolbar at bottom */}
            {isAdmin && manageMode && selectedUserIds.length > 0 && (() => {
              // Find selected users
              const selectedUsers = teams.filter((u: User) => selectedUserIds.includes(u._id));
              const allActive = selectedUsers.every((u: User) => u.active !== false);
              const allInactive = selectedUsers.every((u: User) => u.active === false);
              const isMixed = !allActive && !allInactive;
              return (
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
                    onClick={async () => {
                      // Open assign role modal for bulk
                      setAssignRoleUser(null); // null = bulk
                      setAssignRoleOpen(true);
                    }}
                  >Assign Role</button>
                  {/* Bulk Deactivate */}
                  {/* Bulk Deactivate: hide if current user is in selection */}
                  {!isMixed && allActive && selectedUserIds.every(id => id !== currentUserId) && (
                    <button
                      className="px-3 py-1 rounded bg-yellow-400 text-gray-900 font-medium hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition-colors cursor-pointer"
                      type="button"
                      tabIndex={0}
                      onClick={() => setBulkConfirm({ action: 'deactivate', open: true })}
                      disabled={activateLoading}
                    >Deactivate</button>
                  )}
                  {/* Bulk Activate: hide if current user is in selection */}
                  {!isMixed && allInactive && selectedUserIds.every(id => id !== currentUserId) && (
                    <button
                      className="px-3 py-1 rounded bg-green-500 text-white font-medium hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 transition-colors cursor-pointer"
                      type="button"
                      tabIndex={0}
                      onClick={() => setBulkConfirm({ action: 'activate', open: true })}
                      disabled={activateLoading}
                    >Activate</button>
                  )}
                  {/* Bulk Reset Password */}
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors cursor-pointer"
                    type="button"
                    tabIndex={0}
                    onClick={() => setBulkConfirm({ action: 'resetPw', open: true })}
                    disabled={resetPwLoading}
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
              );
            })()}
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
                        <TableCell className={user.active === false ? 'opacity-50' : ''}>
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user._id)}
                            onChange={() => handleToggleUser(user._id)}
                            className="form-checkbox h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            aria-label={`Select user ${user.name || user.email}`}
                            disabled={user._id === currentUserId}
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
                      <TableCell>
                        <Badge color={user.active !== false ? 'green' : 'red'}>
                          {user.active !== false ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {isAdmin && (
                          <TeamUserMenu
                            isAdmin={isAdmin}
                            isActive={user.active !== false}
                            onAssignRole={() => handleAssignRole(user)}
                            onActivateDeactivate={() => handleActivateDeactivate(user)}
                            onResetPassword={() => handleResetPassword(user)}
                            isSelf={user._id === currentUserId}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
            {/* Button + Pagination Controls Row (under table, flush with table edges) */}
            <div className="flex flex-row items-center w-full px-0 mt-2" style={{marginLeft: 0, marginRight: 0}}>
              <div className="flex items-center mr-4" style={{minWidth: 140, minHeight: 40}}>
                {isAdmin && manageMode ? (
                  <InviteUsersButton onClick={() => setInviteOpen(true)} className="cursor-pointer" />
                ) : (
                  // Invisible placeholder to prevent layout shift
                  <div style={{visibility: 'hidden', height: 40, display: 'flex', alignItems: 'center'}} />
                )}
              </div>
              <div className="flex-1" />
              {totalPages > 1 && (
                <nav className="flex items-center gap-2" aria-label="Pagination">
                  <button
                    className="px-3 py-1 rounded border text-gray-500 disabled:opacity-60 cursor-pointer hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 transition disabled:cursor-not-allowed"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i + 1}
                      className={`px-3 py-1 rounded border mx-1 transition cursor-pointer focus:ring-2 focus:ring-blue-400 ${page === i + 1 ? 'bg-blue-500 text-white cursor-not-allowed' : 'text-blue-500 hover:bg-blue-50'}`}
                      onClick={() => setPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    className="px-3 py-1 rounded border text-gray-500 disabled:opacity-60 cursor-pointer hover:bg-blue-50 focus:ring-2 focus:ring-blue-400 transition disabled:cursor-not-allowed"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </nav>
              )}
            </div>
          </div>
        )}
      </div>
      {/* InviteUsersModal (always rendered, controlled by inviteOpen) */}
      <InviteUsersModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        onInvite={handleInvite}
        loading={inviteLoading}
      />
      {/* Bulk Confirm Modal */}
      <Modal
        open={bulkConfirm.open}
        onClose={() => setBulkConfirm({ action: null, open: false })}
        title={bulkConfirm.action === 'deactivate' ? 'Deactivate Users' : bulkConfirm.action === 'activate' ? 'Activate Users' : 'Reset Passwords'}
      >
        <div className="flex flex-col gap-4">
          <div>
            Are you sure you want to <b>{bulkConfirm.action === 'deactivate' ? 'deactivate' : bulkConfirm.action === 'activate' ? 'activate' : 'send password reset emails to'}</b> the following users?
            <div className="mt-3 mb-3 border rounded bg-gray-50 overflow-hidden">
              <table className="min-w-full text-xs">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Name</th>
                    <th className="px-3 py-2 text-left font-semibold text-gray-700">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {(teams || []).filter((u: User) => selectedUserIds.includes(u._id)).map((u: User) => (
                    <tr key={u._id} className="modal-table-row border-b last:border-0">
                      <td className="modal-table-row px-3 py-2 whitespace-nowrap">{u.name || '-'}</td>
                      <td className="modal-table-row px-3 py-2 whitespace-nowrap text-gray-600">{u.email || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <Button 
              variant="secondary" 
              onClick={() => setBulkConfirm({ action: null, open: false })} 
              disabled={activateLoading || resetPwLoading}
              className="modal-btn modal-cancel-btn cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
            >
              Cancel
            </Button>
            <Button
              className="modal-btn cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              onClick={async () => {
                if (!bulkConfirm.action) return;
                if (bulkConfirm.action === 'deactivate' || bulkConfirm.action === 'activate') {
                  setActivateLoading(true);
                  try {
                    const res = await fetch('/api/users/bulk', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userIds: selectedUserIds, action: bulkConfirm.action })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || `Failed to ${bulkConfirm.action} users`);
                    setToastMsg(`Users ${bulkConfirm.action === 'deactivate' ? 'deactivated' : 'activated'} successfully`);
                    setToastType('success');
                    setToastOpen(true);
                    mutate('/api/users');
                    setSelectedUserIds([]);
                  } catch (err: any) {
                    setToastMsg(err.message || `Failed to ${bulkConfirm.action} users`);
                    setToastType('error');
                    setToastOpen(true);
                  } finally {
                    setActivateLoading(false);
                    setBulkConfirm({ action: null, open: false });
                  }
                } else if (bulkConfirm.action === 'resetPw') {
                  setResetPwLoading(true);
                  try {
                    const res = await fetch('/api/users/bulk', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ userIds: selectedUserIds })
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || 'Failed to send reset emails');
                    setToastMsg('Password reset emails sent');
                    setToastType('success');
                    setToastOpen(true);
                    setSelectedUserIds([]);
                  } catch (err: any) {
                    setToastMsg(err.message || 'Failed to send reset emails');
                    setToastType('error');
                    setToastOpen(true);
                  } finally {
                    setResetPwLoading(false);
                    setBulkConfirm({ action: null, open: false });
                  }
                }
              }}
              isLoading={activateLoading || resetPwLoading}
              disabled={activateLoading || resetPwLoading}
            >
              Confirm
            </Button>
          </div>
        </div>
      </Modal>
      <Toast
        message={toastMsg}
        type={toastType}
        open={toastOpen}
        onClose={() => setToastOpen(false)}
        duration={2200}
      />
    </main>
  );
}

export default TeamPage;
