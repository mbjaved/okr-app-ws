"use client";
// OKRs Page - Scaffold
// Best Practices: Modular component, timeline logging, design prompt reference
// Best_Practices.md: Accessibility, modularity, typed contracts, debug logging, robust UI feedback, timeline logging, design prompt reference, client-side auth, meaningful errors

// Import order: React, third-party, then local components (Best_Practices.md)
import React, { useState, useRef, useEffect } from "react";
import { enrichOwnersWithUserData } from "../../lib/enrichOwnersWithUserData";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as RadixTabs from '@radix-ui/react-tabs';
import { Button } from "../../components/ui/button";
import { Pagination } from "../../components/ui/pagination";
import { OkrDialog } from "../../components/okr/OkrDialog";
import { OkrTabPanel } from "../../components/okr/OkrTabPanel";
import { EmptyState } from "../../components/okr/EmptyState";
import { OkrCard } from "../../components/okr/OkrCard";
import { OkrCardMenu } from "../../components/okr/OkrCardMenu";

// Typed contracts for OKR entity (Best_Practices.md)
interface OwnerData {
  _id: string;
  name?: string;
  avatarUrl?: string;
}

interface Okr {
  _id: string;
  createdBy?: string;
  createdByAvatarUrl?: string;
  createdByInitials?: string;
  userId?: string;
  name?: string;
  objective: string;
  description?: string;
  keyResults: any[];
  category?: string;
  status: 'on_track' | 'off_track' | 'at_risk' | 'completed' | 'active' | 'archived' | 'deleted' | string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  // Legacy single owner field
  owner?: string;
  ownerAvatarUrl?: string;
  // New multi-owner support
  owners?: OwnerData[];
  goalType?: string;
}

// Simple Toast component for feedback
// Accessible Toast component for robust UI feedback (Best_Practices.md)
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  // Auto-dismiss after 3 seconds
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg flex items-center gap-2 ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
      <span>{message}</span>
      <button className="ml-2 text-lg font-bold" onClick={onClose} aria-label="Close toast">×</button>
    </div>
  );
}

export default function OKRsPage() {
  // --- Auth Handling (Best_Practices.md: always render full tree; handle auth inside component) ---
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      // Best Practice: Use direct DOM navigation like the dashboard does
      // This avoids React lifecycle issues during logout by bypassing React's rendering cycle completely
      window.location.href = '/auth/login';
    },
  });

  // --- All useState/useRef/useEffect hooks must be at the top level (Best_Practices.md) ---
// Centralized owner enrichment utility for all OKR data flows
  const [allUsers, setAllUsers] = useState<{ _id: string; name?: string; avatarUrl?: string }[]>([]); // store all users for mapping
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOkr, setEditOkr] = useState<Okr | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ okr: Okr | null; open: boolean; confirmText?: string }>({ okr: null, open: false, confirmText: '' });
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPageAll, setCurrentPageAll] = useState(1);
  const [currentPageArchived, setCurrentPageArchived] = useState(1);
  const [currentPageDeleted, setCurrentPageDeleted] = useState(1);
  const [filterDate, setFilterDate] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterQuarter, setFilterQuarter] = useState("");
  const [filterAssignedTo, setFilterAssignedTo] = useState("");
  const [filterCreatedBy, setFilterCreatedBy] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const activeFiltersCount = [filterDate, filterDepartment, filterCategory, filterQuarter, filterAssignedTo, filterCreatedBy, filterStatus].filter(Boolean).length;
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [okrs, setOkrs] = useState<Okr[]>([]);
  const [archivedOkrs, setArchivedOkrs] = useState<Okr[]>([]);
  const [deletedOkrs, setDeletedOkrs] = useState<Okr[]>([]);
  const [sortBy, setSortBy] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!filtersOpen) return;
    function handleClick(event: MouseEvent) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [filtersOpen]);

  // Show a loading skeleton while session is loading
  if (status === "loading") {
    return (
      <main className="container mx-auto p-8">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <svg className="animate-spin h-8 w-8 text-gray-400 mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          <span className="text-gray-400">Loading...</span>
        </div>
      </main>
    );
  }

// --- Handler Functions (must be inside component before return) ---
  // Edit OKR
  // Helper to map owner IDs to objects using users fetched in fetchOkrs
  // DEPRECATED: Use enrichOwnersWithUserData instead
// function mapOwnersToObjects(owners: any, users: { _id: string; name?: string; avatarUrl?: string }[]) {
//   ...
// }

// All owner enrichment is now handled by enrichOwnersWithUserData from ../../lib/enrichOwnersWithUserData

  const handleEditOkr = (okr: Okr) => {
    // Always pass owners as objects for the dialog
    let ownersArray = enrichOwnersWithUserData(
      okr.owners && okr.owners.length > 0
        ? okr.owners
        : okr.owner
          ? [okr.owner]
          : [],
      allUsers
    );
    // Fallback: if still empty, use current user
    if ((!ownersArray || ownersArray.length === 0) && session?.user?.id) {
      const user = allUsers.find(u => u._id === session.user.id);
      ownersArray = user ? [{ _id: user._id, name: user.name, avatarUrl: user.avatarUrl }] : [{ _id: session.user.id }];
    }
    setEditOkr({ ...okr, owners: ownersArray });
    setDialogOpen(true);
  };

  // Add OKR
  const handleAddOkr = async (okr: any) => {
    try {
      const res = await fetch("/api/okrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(okr)
      });
      const created = await res.json();
      if (!res.ok) {
        throw new Error(created.error || "Failed to create OKR");
      }
      setToast({ message: "OKR created successfully!", type: "success" });
      setDialogOpen(false);
      fetchOkrs();
      // If current page is now empty after the operation, go to previous page
      setTimeout(() => {
        setCurrentPageAll(prev => {
          const total = Math.ceil((okrs.length + 1) / 10); // +1 because the new OKR isn't in state yet
          return prev > total ? Math.max(1, total) : prev;
        });
      }, 0);
    } catch (err: any) {
      setToast({ message: err.message || "Failed to create OKR", type: "error" });
    }
  };

  // Update OKR
  const handleUpdateOkr = async (okr: any, prevStatus?: string) => {
    if (!okr._id) {
      setToast({ message: "Invalid OKR: missing ID.", type: "error" });
      return;
    }
    try {
      const res = await fetch(`/api/okrs/${okr._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(okr)
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to update OKR");
      }
      if (prevStatus && okr.status !== prevStatus) {
        if (okr.status === "archived") {
          setToast({ message: "OKR archived successfully!", type: "success" });
        } else if (okr.status === "active") {
          setToast({ message: "OKR unarchived successfully!", type: "success" });
        } else {
          setToast({ message: "OKR updated successfully!", type: "success" });
        }
      } else {
        setToast({ message: "OKR updated successfully!", type: "success" });
      }
      setDialogOpen(false);
      setEditOkr(null);
      fetchOkrs();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update OKR", type: "error" });
    }
  };

  // Duplicate OKR
  const handleDuplicateOkr = async (okr: Okr) => {
    try {
      const { _id, createdAt, updatedAt, status, ...rest } = okr;
      const validCategory = okr.category === 'Individual' || okr.category === 'Team' ? okr.category : 'Individual';
      // Always map owners to string IDs for POST
      // Debug log for original owners array
      console.log('[OKR DEBUG] okr.owners before mapping:', okr.owners);
      let ownersArray: string[] = [];
      if (okr.owners && okr.owners.length > 0) {
        ownersArray = okr.owners
          .map((owner: any) =>
            typeof owner === 'string'
              ? owner
              : owner && (owner._id || owner.userId || owner.id || owner.email || owner.name)
          )
          .filter((id: any) => typeof id === 'string' && !!id);
      } else if (okr.owner) {
        ownersArray = [okr.owner];
      } else if (session?.user?.id) {
        ownersArray = [session.user.id];
      }
      // Fallback: if still empty, use current user
      if (!ownersArray.length && session?.user?.id) {
        ownersArray = [session.user.id];
      }
      // Handle category-specific logic
      if (validCategory === 'Individual') {
        // Only one owner allowed
        ownersArray = ownersArray.filter(Boolean).slice(0, 1);
        if (!ownersArray.length && session?.user?.id) {
          ownersArray = [session.user.id];
        }
      } else {
        // Team: allow multiple owners, but filter out falsy and non-string values
        ownersArray = ownersArray.filter(id => typeof id === 'string' && !!id);
      }
      // Debug log for full payload
      console.log('[OKR DEBUG] Duplicate payload:', {
        ...rest,
        status: 'active',
        objective: okr.objective + ' (Copy)',
        category: validCategory,
        owners: ownersArray,
        keyResults: (okr.keyResults || []).map((kr: any) => {
          if (kr.type === 'percent') {
            return { ...kr, progress: 0 };
          } else if (kr.type === 'target') {
            return { ...kr, current: 0 };
          }
          return kr;
        })
      });
      const duplicate = {
        ...rest,
        status: 'active',
        objective: okr.objective + ' (Copy)',
        category: validCategory,
        createdBy: okr.createdBy,
        createdByAvatarUrl: okr.createdByAvatarUrl,
        createdByInitials: okr.createdByInitials,
        owners: enrichOwnersWithUserData(ownersArray, allUsers),
        keyResults: (okr.keyResults || []).map((kr: any) => {
          if (kr.type === 'percent') {
            return { ...kr, progress: 0 };
          } else if (kr.type === 'target') {
            return { ...kr, current: 0 };
          }
          return kr;
        })
      };
      // Timeline log: duplication attempt
      await handleAddOkr(duplicate); // Success toast now handled by handleAddOkr only if creation succeeded
    } catch (err: any) {
      let errorMsg = 'Failed to duplicate OKR.';
      if (err && typeof err === 'object') {
        errorMsg = err.message || (err.response && err.response.data && err.response.data.error) || errorMsg;
      }
      setToast({ message: errorMsg, type: 'error' });
    } finally {
      // Add a finally block to ensure the function ends with a single closing brace
    }
  };



  // Delete OKR (open modal)
  const handleDeleteOkr = (okr: Okr) => {
    setDeleteConfirm({ okr, open: true, confirmText: '' });
  };

  // Confirm delete (soft/hard)
  const confirmDeleteOkr = async () => {
    if (!deleteConfirm.okr) return;
    try {
      const isHardDelete = deleteConfirm.okr.status === 'deleted';
      const url = `/api/okrs/${deleteConfirm.okr._id}${isHardDelete ? '?hard=true' : ''}`;
      const res = await fetch(url, { method: "DELETE" });
      let data: any = {};
      try {
        data = await res.json();
      } catch (parseErr) {
        setToast({ message: 'Unexpected server response. Please try again later.', type: 'error' });
        setDeleteConfirm({ okr: null, open: false });
        return;
      }
      if (!res.ok) {
        const errorMsg = data.error || data.message || 'Failed to delete OKR. Please check your connection or contact support.';
        setToast({ message: errorMsg, type: 'error' });
        setDeleteConfirm({ okr: null, open: false });
        return;
      }
      setToast({ message: isHardDelete ? "OKR permanently deleted." : "OKR deleted (soft).", type: "success" });
      setDeleteConfirm({ okr: null, open: false });
      if (isHardDelete) {
        setDeletedOkrs(prev => prev.filter(okr => okr._id !== deleteConfirm.okr?._id));
      } else {
        setArchivedOkrs(prev => prev.filter(okr => okr._id !== deleteConfirm.okr?._id));
        setDeletedOkrs(prev => [...prev, { ...deleteConfirm.okr!, status: 'deleted' }]);
      }
      fetchOkrs();
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to delete OKR', type: 'error' });
    }
  };

  // Layout: Use shared container for consistent app-wide layout (dashboard, etc.)
  // Timeline log: 2025-06-19, OKRs page layout updated to match dashboard (Best_Practices.md)

  // Pagination best practices (Best_Practices.md)

  const OKRS_PER_PAGE = 10;

  // Tab state for RadixTabs
  const [tabValue, setTabValue] = useState<'all' | 'archived' | 'deleted'>('all');

  // --- Filtered OKRs (All tab) ---
  const filteredOkrs = okrs.filter((okr) => {
    // Search (title/description)
    const searchTerm = search.trim().toLowerCase();
    if (searchTerm && !(
      okr.objective?.toLowerCase().includes(searchTerm) ||
      okr.description?.toLowerCase().includes(searchTerm)
    )) return false;
    // Due date (endDate)
    if (filterDate && okr.endDate && okr.endDate !== filterDate) return false;
    // Category
    if (filterCategory && okr.category !== filterCategory) return false;
    // Department
    if (filterDepartment && okr.department !== filterDepartment) return false;
    // Assigned to (owner or keyResults.assignedTo)
    if (filterAssignedTo && !(okr.owner?.toLowerCase().includes(filterAssignedTo.toLowerCase()) || okr.keyResults?.some((kr: any) => kr.assignedTo?.some((a: string) => a.toLowerCase().includes(filterAssignedTo.toLowerCase()))))) return false;
    // Created by
    if (filterCreatedBy && !(okr.name?.toLowerCase().includes(filterCreatedBy.toLowerCase()))) return false;
    // Status
    if (filterStatus && okr.status !== filterStatus) return false;
    return true;
  });

// --- Fetch OKRs and Users ---
const fetchOkrs = async () => {
  setLoading(true);
  setError("");
  try {
    const res = await fetch("/api/okrs");
    if (!res.ok) throw new Error("Failed to fetch OKRs");
    const data = await res.json();
    // Patch: Accept both { okrs: [...] } and raw array response
    const okrs: Okr[] = Array.isArray(data.okrs) ? data.okrs : Array.isArray(data) ? data : [];
    console.log('[OKR DEBUG] Parsed OKRs from API:', okrs.length, okrs);
    // Fetch users for avatar enrichment
    const usersRes = await fetch("/api/users");
    if (!usersRes.ok) throw new Error("Failed to fetch users");
    const usersArr = await usersRes.json();
    setAllUsers(usersArr);
    // Enrich owners with user data
    const enrichedOkrs = okrs.map(okr => {
      // Find creator user object
      const creator = usersArr.find((u: any) => u._id === (okr.createdBy || okr.userId));
      return {
        ...okr,
        owners: enrichOwnersWithUserData(okr.owners || [], usersArr),
        createdBy: creator?.name || okr.createdBy || okr.userId || '',
        createdByAvatarUrl: creator?.avatarUrl || '',
        createdByInitials: creator?.name ? creator.name.split(' ').map((n: string) => n[0]).join('').slice(0,2).toUpperCase() : ''
      };
    });
    setOkrs(enrichedOkrs.filter(okr => okr.status !== 'archived' && okr.status !== 'deleted'));
    setArchivedOkrs(enrichedOkrs.filter(okr => okr.status === 'archived'));
    setDeletedOkrs(enrichedOkrs.filter(okr => okr.status === 'deleted'));
    // --- UX PATCH: If current page is empty after update, go to previous page (for all tabs) ---
    const PAGE_SIZE = 10;
    // All OKRs
    setCurrentPageAll(prev => {
      const total = Math.ceil(enrichedOkrs.filter(okr => okr.status !== 'archived' && okr.status !== 'deleted').length / PAGE_SIZE);
      return prev > total ? Math.max(1, total) : prev;
    });
    // Archived
    setCurrentPageArchived(prev => {
      const total = Math.ceil(enrichedOkrs.filter(okr => okr.status === 'archived').length / PAGE_SIZE);
      return prev > total ? Math.max(1, total) : prev;
    });
    // Deleted
    setCurrentPageDeleted(prev => {
      const total = Math.ceil(enrichedOkrs.filter(okr => okr.status === 'deleted').length / PAGE_SIZE);
      return prev > total ? Math.max(1, total) : prev;
    });
  } catch (err: any) {
    setError(err.message || "Unknown error");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  fetchOkrs();
}, []);

// ... rest of the code remains the same ...

  // Timeline log: 2025-06-20, Filter logic unified for all OKR tabs (see DEVELOPMENT_TIMELINE.md)
  const filteredArchivedOkrs: Okr[] = archivedOkrs.filter(okr => okr.status === 'archived' && (
    // Apply all filters as in applyAllFilters
    (search.trim() === '' || okr.objective.toLowerCase().includes(search.trim().toLowerCase()) || okr.description?.toLowerCase().includes(search.trim().toLowerCase()) || (typeof okr.name === 'string' && okr.name.toLowerCase().includes(search.trim().toLowerCase()))) &&
    (!filterDate || (okr.endDate && okr.endDate.startsWith(filterDate))) &&
    (!filterCategory || okr.category === filterCategory) &&
    (!filterQuarter || (okr.startDate && okr.startDate.includes(filterQuarter))) &&
    (!filterAssignedTo || (okr.owner && okr.owner.toLowerCase().includes(filterAssignedTo.toLowerCase()))) &&
    (!filterCreatedBy || (okr.name && (okr.name as string).toLowerCase().includes(filterCreatedBy.toLowerCase()))) &&
    (!filterStatus || okr.status === filterStatus)
  ));
  const filteredDeletedOkrs: Okr[] = deletedOkrs.filter(okr => okr.status === 'deleted' && (
    (search.trim() === '' || okr.objective.toLowerCase().includes(search.trim().toLowerCase()) || okr.description?.toLowerCase().includes(search.trim().toLowerCase()) || (typeof okr.name === 'string' && okr.name.toLowerCase().includes(search.trim().toLowerCase()))) &&
    (!filterDate || (okr.endDate && okr.endDate.startsWith(filterDate))) &&
    (!filterCategory || okr.category === filterCategory) &&
    (!filterQuarter || (okr.startDate && okr.startDate.includes(filterQuarter))) &&
    (!filterAssignedTo || (okr.owner && okr.owner.toLowerCase().includes(filterAssignedTo.toLowerCase()))) &&
    (!filterCreatedBy || (okr.name && (okr.name as string).toLowerCase().includes(filterCreatedBy.toLowerCase()))) &&
    (!filterStatus || okr.status === filterStatus)
  ));

  return (
    <main className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header row: title/desc left, Create OKR button right */}
      {/* Header row: title/desc left, Create OKR button right-aligned */}
      <div className="w-full flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OKRs</h1>
          <p className="text-muted-foreground mt-1 text-base">Track, manage, and review your Objectives and Key Results.</p>
        </div>
        <Button
          variant="primary"
          className="px-6 py-2 bg-blue-600 text-white font-bold rounded-full shadow hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 transition"
          onClick={() => { setDialogOpen(true); setEditOkr(null); }}
          aria-label="Create a new OKR"
        >
          + Create OKR
        </Button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
        <label htmlFor="okr-search" className="sr-only">Search OKRs</label>
        <input
          id="okr-search"
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search OKRs by Title or Description..."
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition text-base"
          aria-label="Search OKRs by Title or Description"
        />
        <Button
          variant="outline"
          className="flex gap-2 items-center ml-2 transition-colors duration-150 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
          onClick={() => setFiltersOpen((open) => !open)}
          aria-label="Show filters"
        >
          Filters
          {activeFiltersCount > 0 && (
            <span className="inline-flex items-center justify-center rounded-full bg-blue-500 text-white text-xs font-bold w-5 h-5 ml-1">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </div>
      {/* Filter Panel (slide-down) */}
      {filtersOpen && (
        <div
          ref={filterPanelRef}
          className="absolute left-0 right-0 z-30 mx-auto mt-2 w-full max-w-5xl bg-white rounded-xl shadow-lg border border-gray-200 p-6 flex flex-col gap-4 animate-fade-in-down"
          role="dialog"
          aria-modal="true"
          aria-label="OKR Filters Panel"
          tabIndex={-1}
          onKeyDown={e => { if (e.key === 'Escape') setFiltersOpen(false); }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="filter-date" className="block text-sm font-medium mb-1">Due Date</label>
              <input
                id="filter-date"
                type="date"
                className="w-full rounded border px-3 py-2 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                aria-label="Filter by due date"
              />
            </div>
            <div>
              <label htmlFor="filter-department" className="block text-sm font-medium mb-1">Department</label>
              <select
                id="filter-department"
                className="w-full rounded border px-3 py-2 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                value={filterDepartment}
                onChange={e => setFilterDepartment(e.target.value)}
                aria-label="Filter by department"
              >
                <option className="cursor-pointer hover:bg-blue-50" value="">All Departments</option>
                <option className="cursor-pointer hover:bg-blue-50" value="Engineering">Engineering</option>
                <option className="cursor-pointer hover:bg-blue-50" value="QA">QA</option>
                <option className="cursor-pointer hover:bg-blue-50" value="Product">Product</option>
                {/* TODO: Populate dynamically */}
              </select>
            </div>
            <div>
              <label htmlFor="filter-category" className="block text-sm font-medium mb-1">Category</label>
              <select
                id="filter-category"
                className="w-full rounded border px-3 py-2 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
                aria-label="Filter by category"
              >
                <option className="cursor-pointer hover:bg-blue-50" value="">All Categories</option>
                <option className="cursor-pointer hover:bg-blue-50" value="Team">Team</option>
                <option className="cursor-pointer hover:bg-blue-50" value="Individual">Individual</option>
                {/* TODO: Populate dynamically */}
              </select>
            </div>
            <div>
              <label htmlFor="filter-quarter" className="block text-sm font-medium mb-1">Quarter</label>
              <select
                id="filter-quarter"
                className="w-full rounded border px-3 py-2 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                value={filterQuarter}
                onChange={e => setFilterQuarter(e.target.value)}
                aria-label="Filter by quarter"
              >
                <option className="cursor-pointer hover:bg-blue-50" value="">Select Quarter</option>
                <option className="cursor-pointer hover:bg-blue-50" value="Q1">Q1</option>
                <option className="cursor-pointer hover:bg-blue-50" value="Q2">Q2</option>
                <option className="cursor-pointer hover:bg-blue-50" value="Q3">Q3</option>
                <option className="cursor-pointer hover:bg-blue-50" value="Q4">Q4</option>
              </select>
            </div>
            <div>
              <label htmlFor="filter-assigned" className="block text-sm font-medium mb-1">Assigned to</label>
              <input
                id="filter-assigned"
                type="text"
                className="w-full rounded border px-3 py-2 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                placeholder="Assigned to"
                value={filterAssignedTo}
                onChange={e => setFilterAssignedTo(e.target.value)}
                aria-label="Filter by assignee"
              />
            </div>
            <div>
              <label htmlFor="filter-created" className="block text-sm font-medium mb-1">Created by</label>
              <input
                id="filter-created"
                type="text"
                className="w-full rounded border px-3 py-2 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                placeholder="Created by"
                value={filterCreatedBy}
                onChange={e => setFilterCreatedBy(e.target.value)}
                aria-label="Filter by creator"
              />
            </div>
            <div>
              <label htmlFor="filter-status" className="block text-sm font-medium mb-1">Status</label>
              <select
                id="filter-status"
                className="w-full rounded border px-3 py-2 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option className="cursor-pointer hover:bg-blue-50" value="">All Statuses</option>
                <option className="cursor-pointer hover:bg-blue-50" value="On Track">On Track</option>
                <option className="cursor-pointer hover:bg-blue-50" value="At Risk">At Risk</option>
                <option className="cursor-pointer hover:bg-blue-50" value="Off Track">Off Track</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              className="rounded px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 text-gray-700 transition-colors duration-150 border border-gray-200"
              onClick={() => setFiltersOpen(false)}
            >
              Apply
            </button>
            <button
              type="button"
              className="rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors duration-150 border border-blue-600"
              onClick={() => {
                setFilterDate("");
                setFilterDepartment("");
                setFilterCategory("");
                setFilterQuarter("");
                setFilterAssignedTo("");
                setFilterCreatedBy("");
                setFilterStatus("");
              }}
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {/* Soft Delete Confirmation Modal (Archived Tab) */}
      {deleteConfirm.open && deleteConfirm.okr && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-okr-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          tabIndex={-1}
          onKeyDown={e => {
            if (e.key === 'Escape') setDeleteConfirm({ okr: null, open: false, confirmText: '' });
          }}
        >
          <div className={`bg-white rounded-lg shadow-lg p-6 w-full max-w-sm flex flex-col gap-4 focus:outline-none ${deleteConfirm.okr.status === 'deleted' ? 'border-2 border-yellow-300' : ''}`} tabIndex={0}>
            {/* Modal header and icon */}
            {deleteConfirm.okr.status === 'deleted' ? (
              <div className="flex items-center gap-3 mb-1">
                <svg className="w-8 h-8 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="#FEF3C7" />
                  <path d="M12 8v4" stroke="#F59E42" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="12" cy="16" r="1" fill="#F59E42" />
                </svg>
                <h2 id="delete-okr-title" className="text-lg font-bold text-yellow-900">Permanently Delete OKR?</h2>
              </div>
            ) : (
              <h2 id="delete-okr-title" className="text-lg font-bold text-gray-900">Delete OKR?</h2>
            )}
            {/* Modal body */}
            {deleteConfirm.okr.status === 'deleted' ? (
              <>
                <p className="text-yellow-900 bg-yellow-50 rounded px-3 py-2 border border-yellow-200">
                  Are you sure you want to <b>permanently delete</b> <span className="font-semibold">{deleteConfirm.okr.objective}</span>? <b>This action cannot be undone.</b>
                </p>
                <div className="flex flex-col gap-2 w-full">
                  <label htmlFor="hard-delete-confirm" className="text-sm text-gray-700">
                    Please type <span className="font-semibold">{deleteConfirm.okr.objective}</span> to confirm permanent deletion:
                  </label>
                  <input
                    id="hard-delete-confirm"
                    type="text"
                    className="border border-yellow-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder={deleteConfirm.okr.objective}
                    value={deleteConfirm.confirmText || ''}
                    onChange={e => setDeleteConfirm(dc => ({ ...dc, confirmText: e.target.value }))}
                    aria-label={`Type ${deleteConfirm.okr.objective} to confirm deletion`}
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      className="px-4 py-2 rounded border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors"
                      onClick={() => setDeleteConfirm({ okr: null, open: false, confirmText: '' })}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className={`px-4 py-2 rounded text-white font-semibold focus:outline-none focus:ring-2 focus:ring-red-400 transition-colors ${deleteConfirm.confirmText === deleteConfirm.okr.objective ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'}`}
                      disabled={deleteConfirm.confirmText !== deleteConfirm.okr.objective}
                      onClick={async () => {
                        if (!deleteConfirm.okr || deleteConfirm.confirmText !== deleteConfirm.okr.objective) return;
                        try {
                          const res = await fetch(`/api/okrs/${deleteConfirm.okr._id}?hard=true`, { method: 'DELETE' });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.error || 'Failed to hard delete OKR');
                          setToast({ message: 'OKR permanently deleted.', type: 'success' });
                          setDeleteConfirm({ okr: null, open: false, confirmText: '' });
                          setDeletedOkrs(prev => prev.filter(okr => okr._id !== deleteConfirm.okr?._id));
                        } catch (err: any) {
                          setToast({ message: err.message || 'Failed to hard delete OKR', type: 'error' });
                        }
                      }}
                      title="Permanently delete this OKR (irreversible)"
                      aria-label="Hard delete OKR"
                      type="button"
                    >
                      Hard Delete
                    </button>
                  </div>
                  {deleteConfirm.confirmText && deleteConfirm.confirmText !== deleteConfirm.okr.objective && (
                    <span className="text-xs text-red-500 mt-2">Name does not match. Please type the OKR name exactly.</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-700">
                  Are you sure you want to delete <span className="font-semibold">{deleteConfirm.okr.objective}</span>? <b>You can restore it later from the Deleted OKRs tab.</b>
                </p>
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    onClick={() => setDeleteConfirm({ okr: null, open: false })}
                    autoFocus
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                    onClick={confirmDeleteOkr}
                    aria-label="Soft delete OKR"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Dialog for Add/Edit OKR */}
      {dialogOpen && (
        <OkrDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditOkr(null);
          }}
          onSave={editOkr ? handleUpdateOkr : handleAddOkr}
          initialData={editOkr ? {
            ...editOkr,
            category: editOkr.category === 'Team' || editOkr.category === 'Individual' ? editOkr.category : undefined,
          } : undefined}
        />
      )}
      {/* Main page content starts here */}
      {/* Timeline log: Refactored to use Radix UI Tabs for accessibility, modularity, and robust feedback (2025-05-23, see DEVELOPMENT_TIMELINE.md) */}
      <RadixTabs.Root value={tabValue} onValueChange={(val: string) => setTabValue(val as 'all' | 'archived' | 'deleted')} className="w-full">
        <RadixTabs.List
          className="flex gap-2 mb-6 px-2 py-1 bg-white border border-gray-200 rounded-xl shadow-sm"
          aria-label="OKRs Tabs"
        >
          <RadixTabs.Trigger
            value="all"
            id="okrs-all-tab"
            className="px-6 py-2 rounded-lg text-base font-bold transition-colors cursor-pointer hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 data-[state=active]:shadow data-[state=active]:border-blue-600 border border-transparent"
          >
            All OKRs
          </RadixTabs.Trigger>
          <RadixTabs.Trigger
            value="archived"
            id="okrs-archived-tab"
            className="px-6 py-2 rounded-lg text-base font-semibold transition-colors cursor-pointer hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 data-[state=active]:bg-gray-100 data-[state=active]:text-gray-700 data-[state=active]:shadow data-[state=active]:border-gray-400 border border-transparent"
          >
            Archived OKRs
          </RadixTabs.Trigger>
          <RadixTabs.Trigger
            value="deleted"
            id="okrs-deleted-tab"
            className="px-6 py-2 rounded-lg text-base font-semibold transition-colors cursor-pointer hover:bg-red-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 data-[state=active]:bg-red-50 data-[state=active]:text-red-700 data-[state=active]:shadow data-[state=active]:border-red-600 border border-transparent"
          >
            Deleted OKRs
          </RadixTabs.Trigger>
        </RadixTabs.List>
        <RadixTabs.Content value="all" id="okrs-all-panel" role="tabpanel" aria-labelledby="okrs-all-tab">
          {loading && <div className="text-center py-8">Loading OKRs...</div>}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}

          <div className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" tabIndex={0} aria-label="OKR List">
            <div className="flex flex-col gap-4">
              {filteredOkrs.slice((currentPageAll - 1) * OKRS_PER_PAGE, currentPageAll * OKRS_PER_PAGE).map((okr) => (
                <div key={okr._id} className="relative">
                  <OkrCard
                    objective={okr.objective}
                    dueDate={okr.endDate ? okr.endDate.slice(0, 10) : "-"}
                    status={okr.status}
                    keyResults={okr.keyResults}
                    lastUpdated={okr.updatedAt?.slice(0, 10) || "-"}
                    owners={okr.owners || []}
                    description={okr.description}
                    createdBy={okr.createdBy}
                    createdByAvatarUrl={okr.createdByAvatarUrl}
                    createdByInitials={okr.createdByInitials}
                    goalType={okr.goalType}
                    {...(console.debug('[OkrCard owners]', okr.owners), {})}
                  />
                  <div className="absolute top-2 right-2">
                    <OkrCardMenu
                      status={okr.status as 'active' | 'archived' | 'deleted'}
                      onEdit={() => handleEditOkr(okr)}
                      onDuplicate={() => handleDuplicateOkr(okr)}
                      onArchive={okr.status === 'active' ? () => handleUpdateOkr({ ...okr, status: 'archived' }, okr.status) : okr.status === 'archived' ? () => handleDeleteOkr(okr) : undefined}
                      onRestore={okr.status === 'deleted' ? () => handleUpdateOkr({ ...okr, status: 'active' }, okr.status) : undefined}
                      onHardDelete={okr.status === 'deleted' ? () => handleDeleteOkr(okr) : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Pagination
            currentPage={currentPageAll}
            totalPages={Math.ceil(filteredOkrs.length / OKRS_PER_PAGE)}
            onPageChange={setCurrentPageAll}
          />
          {!loading && !error && filteredOkrs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12" role="status" aria-live="polite">
              <svg width="64" height="64" fill="none" viewBox="0 0 64 64" aria-hidden="true" className="mb-4">
                <rect x="8" y="20" width="48" height="32" rx="6" fill="#f3f4f6" />
                <path d="M16 28h32v2H16z" fill="#e5e7eb" />
                <circle cx="32" cy="40" r="6" fill="#34d399" />
                <path d="M32 37v6" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <div className="text-gray-400">No OKRs found.</div>
            </div>
          )}
        </RadixTabs.Content>
        <RadixTabs.Content value="archived" id="okrs-archived-panel" role="tabpanel" aria-labelledby="okrs-archived-tab">
          <OkrTabPanel
            okrs={filteredArchivedOkrs.slice((currentPageArchived - 1) * OKRS_PER_PAGE, currentPageArchived * OKRS_PER_PAGE)}
            users={allUsers}
            loading={loading}
            error={error}
            emptyState={{
              svg: (
                <svg width="64" height="64" fill="none" viewBox="0 0 64 64" aria-hidden="true" className="mb-4">
                  <rect x="8" y="20" width="48" height="32" rx="6" fill="#f3f4f6" />
                  <path d="M16 28h32v2H16z" fill="#e5e7eb" />
                  <circle cx="32" cy="40" r="6" fill="#60a5fa" />
                  <path d="M27 41h10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ),
              message: "OKRs you archive will appear here for future reference."
            }}
            currentPage={currentPageArchived}
            totalPages={Math.ceil(filteredArchivedOkrs.length / OKRS_PER_PAGE)}
            onPageChange={setCurrentPageArchived}
            onEdit={handleEditOkr}
            onDuplicate={handleDuplicateOkr}
            onDelete={handleDeleteOkr}
            tabRole="Archived OKR List"
          />
        </RadixTabs.Content>

        {/* Best_Practices.md: Modular, accessible, DRY. DESIGN_PROMPTS: Consistent card/empty-state UX. */}
        <RadixTabs.Content value="deleted" id="okrs-deleted-panel" role="tabpanel" aria-labelledby="okrs-deleted-tab">
          <OkrTabPanel
            okrs={filteredDeletedOkrs.slice((currentPageDeleted - 1) * OKRS_PER_PAGE, currentPageDeleted * OKRS_PER_PAGE)}
            users={allUsers}
            loading={loading}
            error={error}
            emptyState={{
              svg: (
                <svg width="64" height="64" fill="none" viewBox="0 0 64 64" aria-hidden="true" className="mb-4">
                  <rect x="8" y="20" width="48" height="32" rx="6" fill="#f3f4f6" />
                  <path d="M16 28h32v2H16z" fill="#e5e7eb" />
                  <circle cx="32" cy="40" r="6" fill="#f87171" />
                  <path d="M29 39l2 2 4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ),
              message: "OKRs you delete from the Archived tab will appear here until removed."
            }}
            currentPage={currentPageDeleted}
            totalPages={Math.ceil(filteredDeletedOkrs.length / OKRS_PER_PAGE)}
            onPageChange={setCurrentPageDeleted}
            onEdit={handleEditOkr}
            onDuplicate={handleDuplicateOkr}
            onRestore={(okr) => handleUpdateOkr({ ...okr, status: 'active' }, okr.status)}
            onHardDelete={handleDeleteOkr}
            tabRole="Deleted OKR List"
          />
        </RadixTabs.Content>
      </RadixTabs.Root>
    </main>
  );
}