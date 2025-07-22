"use client";
// OKRs Page - Scaffold
// Best Practices: Modular component, timeline logging, design prompt reference
// Best_Practices.md: Accessibility, modularity, typed contracts, debug logging, robust UI feedback, timeline logging, design prompt reference, client-side auth, meaningful errors

// Import order: React, third-party, then local components (Best_Practices.md)
import React, { useState, useRef, useEffect } from "react";
import { useSearchParams } from 'next/navigation';
import { DatePickerFilter } from "./DatePickerFilter";
import { enrichOwnersWithUserData } from "../../lib/enrichOwnersWithUserData";
import { extractQuartersFromOkrs, okrMatchesQuarters, Quarter } from "../../lib/quarterUtils";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import * as RadixTabs from '@radix-ui/react-tabs';
import { Button } from "../../components/ui/button";
import { Pagination } from "../../components/ui/pagination";
import { MultiSelect, MultiSelectOption } from "../../components/ui/MultiSelect";
import { OkrDialog } from "../../components/okr/OkrDialog";
import { OkrTabPanel } from "../../components/okr/OkrTabPanel";
import { OkrCard } from "../../components/okr/OkrCard";
import { OkrCardMenu } from "../../components/okr/OkrCardMenu";
import { ConfirmModal } from "../../components/ui/ConfirmModal";

// Typed contracts for OKR entity (Best_Practices.md)
interface OwnerData {
  _id: string;
  name?: string;
  avatarUrl?: string;
}

interface Okr {
  _id: string;
  createdBy?: string; // always user ID for filtering
  createdByName?: string; // for display only
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
  department?: string; // Added for filter compatibility
  slug?: string; // Add slug field for navigation
}

// Deduplicate and disambiguate user options for Created By MultiSelect
const dedupedUserOptions = (allUsers: any[]) => {
  const seen = new Map();
  return allUsers.map(u => {
    let label = u.name || u._id;
    if (seen.has(label)) {
      // Disambiguate duplicate names
      label = `${label} (${u.email || u._id})`;
    }
    seen.set(label, true);
    return { value: u._id, label, avatarUrl: u.avatarUrl };
  });
};


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

// Utility: Generate a slug from an OKR objective or name
function generateSlug(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanum with dash
    .replace(/^-+|-+$/g, '')     // trim leading/trailing dashes
    .slice(0, 50);               // limit length if needed
}

export default function OKRsPage() {
  // Use Next.js useSearchParams for tab param
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab') || 'all';
  const [tab, setTab] = useState(tabParam);

  // Keep tab state in sync with the URL param
  useEffect(() => {
    if (tab !== tabParam) setTab(tabParam);
  }, [tabParam]);

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
  const [filterQuarters, setFilterQuarters] = useState<string[]>([]);
  const [filterCreatedBy, setFilterCreatedBy] = useState<string[]>([]);
  const [filterOwners, setFilterOwners] = useState<string[]>([]);
  // --- Sync status query param with filterStatus ---
  const statusParam = searchParams?.get('status') || '';
  const [filterStatus, setFilterStatus] = useState(statusParam);
  const [departments, setDepartments] = useState<{_id: string, name: string}[]>([]);

  // Keep filterStatus in sync with query param (on navigation)
  useEffect(() => {
    if (statusParam !== filterStatus) setFilterStatus(statusParam);
  }, [statusParam]);

  // Fetch departments for filter dropdown
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const res = await fetch("/api/departments");
        if (res.ok) {
          const data = await res.json();
          setDepartments(data);
        }
      } catch (error) {
        console.error("Failed to fetch departments:", error);
      }
    }
    fetchDepartments();
  }, []);

  // When filterStatus changes (via UI), update the URL query param
  useEffect(() => {
    if (filterStatus !== statusParam) {
      const params = new URLSearchParams(Array.from(searchParams?.entries?.() || []));
      if (filterStatus) {
        params.set('status', filterStatus);
      } else {
        params.delete('status');
      }
      router.replace(`?${params.toString()}`);
    }
  }, [filterStatus]);
  const [okrs, setOkrs] = useState<Okr[]>([]);
  const [archivedOkrs, setArchivedOkrs] = useState<Okr[]>([]);
  const [deletedOkrs, setDeletedOkrs] = useState<Okr[]>([]);
  // Dynamically compute unique status options from all OKRs (All, Archived, Deleted)
  const statusOptions = React.useMemo(() => {
    const allStatuses = [...okrs, ...archivedOkrs, ...deletedOkrs]
      .map(o => o.status)
      .filter(Boolean)
      .map(s => s.toString().trim())
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .filter(v => !['active', 'archived', 'deleted'].includes(v.toLowerCase()));
    // Sort for consistency, capitalize first letter for display
    return allStatuses.sort((a, b) => a.localeCompare(b));
  }, [okrs, archivedOkrs, deletedOkrs]);
  // Only count filterCreatedBy if it has selected values
  const activeFiltersCount = [
    filterDate,
    filterDepartment,
    filterCategory,
    ...(filterQuarters && filterQuarters.length > 0 ? [1] : []),
    filterStatus,
    ...(filterCreatedBy && filterCreatedBy.length > 0 ? [1] : []),
    ...(filterOwners && filterOwners.length > 0 ? [1] : [])
  ].filter(Boolean).length;
  const filterPanelRef = useRef<HTMLDivElement>(null);
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
  // Always generate a slug for new OKR before POST
  const handleAddOkr = async (okr: any) => {
    // Generate a slug from the objective or name
    const slug = generateSlug(okr.objective || okr.name || 'okr');
    const okrWithSlug = { ...okr, slug };

    try {
      const res = await fetch("/api/okrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(okrWithSlug)
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
  // Always generate a slug for OKR before PUT (update)
  const handleUpdateOkr = async (okr: any, prevStatus?: string) => {
    const slug = generateSlug(okr.objective || okr.name || 'okr');
    const okrWithSlug = { ...okr, slug };

    if (!okr._id) {
      console.log('[ARCHIVE DEBUG] Missing OKR ID:', okr);
      setToast({ message: "Invalid OKR: missing ID.", type: "error" });
      return;
    }
    try {
      console.log('[ARCHIVE DEBUG] Sending PUT request:', {
        url: `/api/okrs/${okr._id}`,
        payload: okrWithSlug,
        payloadStatus: okrWithSlug.status,
        payloadKeys: Object.keys(okrWithSlug)
      });
      
      const res = await fetch(`/api/okrs/${okr._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(okrWithSlug)
      });
      const resData = await res.json();
      
      console.log('[ARCHIVE DEBUG] API Response:', {
        status: res.status,
        ok: res.ok,
        data: resData
      });
      
      if (!res.ok) {
        console.log('[ARCHIVE DEBUG] API Error:', resData);
        throw new Error(resData.error || "Failed to update OKR");
      }
      if (prevStatus && okr.status !== prevStatus) {
        // Contextual toast messages based on specific status transitions
        if (okr.status === "archived") {
          setToast({ message: "OKR archived successfully!", type: "success" });
        } else if (okr.status === "active" && prevStatus === "deleted") {
          setToast({ message: "OKR restored successfully!", type: "success" });
        } else if (okr.status === "active" && prevStatus === "archived") {
          setToast({ message: "OKR unarchived successfully!", type: "success" });
        } else if (okr.status === "completed") {
          setToast({ message: "OKR marked as completed!", type: "success" });
        } else if (okr.status === "on_track") {
          setToast({ message: "OKR status updated to On Track!", type: "success" });
        } else if (okr.status === "at_risk") {
          setToast({ message: "OKR status updated to At Risk!", type: "success" });
        } else if (okr.status === "off_track") {
          setToast({ message: "OKR status updated to Off Track!", type: "success" });
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
      setToast({ message: isHardDelete ? "OKR permanently deleted." : "OKR moved to Deleted tab.", type: "success" });
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
    // Normalize endDate to YYYY-MM-DD for comparison
    if (filterDate) {
      const normalizedEndDate = okr.endDate ? new Date(okr.endDate).toISOString().slice(0, 10) : '';
      if (!normalizedEndDate || normalizedEndDate !== filterDate) return false;
    }
    // Category
    if (filterCategory && okr.category !== filterCategory) return false;
    // Department
    if (filterDepartment && okr.department !== filterDepartment) return false;
    // Quarter filter - use the same logic as Archived/Deleted tabs
    if (!okrMatchesQuarters(okr, filterQuarters)) return false;
    // Created by
    // Always treat filterCreatedBy as array of user IDs
    if (Array.isArray(filterCreatedBy) && filterCreatedBy.length > 0 && (!okr.createdBy || !filterCreatedBy.includes(okr.createdBy))) return false;
    // Owners filter (multi-select, supports multiple owners per OKR)
    if (Array.isArray(filterOwners) && filterOwners.length > 0) {
      const okrOwnerIds = (okr.owners || []).map((o: any) => o._id || o.userId || o.id).filter(Boolean);
      if (!okrOwnerIds.some((id: string) => filterOwners.includes(id))) return false;
    }
    // Status (normalize and compare case-insensitive)
    if (filterStatus && okr.status && okr.status.toLowerCase().trim() !== filterStatus.toLowerCase().trim()) return false;
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
        // Patch: Ensure every OKR has a valid slug for navigation
        let slug = okr.slug;
        if (!slug || typeof slug !== 'string' || !slug.trim()) {
          slug = generateSlug(okr.objective || okr.name || 'okr');
        }
        return {
          ...okr,
          slug,
          owners: enrichOwnersWithUserData(okr.owners || [], usersArr),
          createdBy: creator?._id || okr.createdBy || okr.userId || '', // always user ID for filtering
          createdByName: creator?.name || '', // for display
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

  // Extract available quarters from all OKRs for dynamic filter options
  const availableQuarters = extractQuartersFromOkrs([...okrs, ...archivedOkrs, ...deletedOkrs]);
  const quarterOptions = availableQuarters.map(quarter => ({
    value: quarter.value,
    label: quarter.label
  }));

  // Timeline log: 2025-06-20, Filter logic unified for all OKR tabs (see DEVELOPMENT_TIMELINE.md)
  const filteredArchivedOkrs: Okr[] = archivedOkrs.filter(okr => {
    // Normalize endDate to YYYY-MM-DD (handles ISO, date string, etc)
    const normalizedEndDate = okr.endDate ? new Date(okr.endDate).toISOString().slice(0, 10) : '';
    return okr.status === 'archived' && (
      (search.trim() === '' || okr.objective.toLowerCase().includes(search.trim().toLowerCase()) || okr.description?.toLowerCase().includes(search.trim().toLowerCase()) || (typeof okr.name === 'string' && okr.name?.toLowerCase().includes(search.trim().toLowerCase()))) &&
      (!filterDate || (normalizedEndDate && normalizedEndDate === filterDate)) &&
      (!filterCategory || okr.category === filterCategory) &&
      (!filterDepartment || okr.department === filterDepartment) &&
      okrMatchesQuarters(okr, filterQuarters) &&
      (filterCreatedBy.length === 0 || (okr.createdBy && filterCreatedBy.includes(okr.createdBy))) &&
      (filterOwners.length === 0 || ((okr.owners || []).map((o: any) => o._id || o.userId || o.id).some((id: string) => filterOwners.includes(id)))) &&
      (!filterStatus || (okr.status && okr.status.toLowerCase().trim() === filterStatus.toLowerCase().trim()))
    );
  });
  
  const filteredDeletedOkrs: Okr[] = deletedOkrs.filter(okr => {
    // Normalize endDate to YYYY-MM-DD (handles ISO, date string, etc)
    const normalizedEndDate = okr.endDate ? new Date(okr.endDate).toISOString().slice(0, 10) : '';
    return okr.status === 'deleted' && (
      (search.trim() === '' || okr.objective.toLowerCase().includes(search.trim().toLowerCase()) || okr.description?.toLowerCase().includes(search.trim().toLowerCase()) || (typeof okr.name === 'string' && okr.name?.toLowerCase().includes(search.trim().toLowerCase()))) &&
      (!filterDate || (normalizedEndDate && normalizedEndDate === filterDate)) &&
      (!filterCategory || okr.category === filterCategory) &&
      (!filterDepartment || okr.department === filterDepartment) &&
      okrMatchesQuarters(okr, filterQuarters) &&
      (filterCreatedBy.length === 0 || (okr.createdBy && filterCreatedBy.includes(okr.createdBy))) &&
      (filterOwners.length === 0 || ((okr.owners || []).map((o: any) => o._id || o.userId || o.id).some((id: string) => filterOwners.includes(id)))) &&
      (!filterStatus || (okr.status && okr.status.toLowerCase().trim() === filterStatus.toLowerCase().trim()))
    );
  });

  // Authentication is handled by useSession({ required: true })
  // No need to check for loading state as NextAuth handles it automatically

  return (
    <main className="container mx-auto p-4 md:p-6 space-y-6">
      {/* Header row: title/desc left, Create OKR button right */}
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
              <MultiSelect
                options={dedupedUserOptions(allUsers)}
                value={Array.isArray(filterOwners) ? filterOwners : []}
                onChange={vals => setFilterOwners(Array.isArray(vals) ? vals : [])}
                placeholder="Select owners"
                label="Owners"
                isMulti={true}
                className="w-full cursor-pointer"
                aria-label="Filter by owners"
              />
            </div>
            <div>
              <label htmlFor="filter-date" className="block text-sm font-medium mb-1">Due Date</label>
              <DatePickerFilter value={filterDate} onChange={setFilterDate} />
            </div>
            <div>
              <label htmlFor="filter-department" className="block text-sm font-medium mb-1">Department</label>
              <select
                id="filter-department"
                className="w-full rounded border px-3 py-2 pr-10 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg fill=\'none\' stroke=\'%234B5563\' stroke-width=\'2\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'></path></svg>')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25em_1.25em]"
                value={filterDepartment}
                onChange={e => setFilterDepartment(e.target.value)}
                aria-label="Filter by department"
              >
                <option className="cursor-pointer hover:bg-blue-50" value="">All Departments</option>
                {departments.map(department => (
                  <option key={department._id} className="cursor-pointer hover:bg-blue-50" value={department.name}>{department.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-category" className="block text-sm font-medium mb-1">Category</label>
              <select
                id="filter-category"
                className="w-full rounded border px-3 py-2 pr-10 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg fill=\'none\' stroke=\'%234B5563\' stroke-width=\'2\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'></path></svg>')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25em_1.25em]"
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
              <MultiSelect
                options={quarterOptions}
                value={filterQuarters}
                onChange={vals => setFilterQuarters(Array.isArray(vals) ? vals : [])}
                placeholder="Select quarters"
                label="Quarter"
                isMulti={true}
                className="w-full cursor-pointer"
                aria-label="Filter by quarter"
              />
            </div>
            <div>
              <MultiSelect
                options={dedupedUserOptions(allUsers)}
                value={Array.isArray(filterCreatedBy) ? filterCreatedBy : []}
                onChange={vals => setFilterCreatedBy(Array.isArray(vals) ? vals : [])}
                placeholder="Select creators"
                label="Created by"
                isMulti={true}
                className="w-full cursor-pointer"
                aria-label="Filter by creator"
              />
            </div>
            {tabValue === 'all' && (
  <div>
    <label htmlFor="filter-status" className="block text-sm font-medium mb-1">Status</label>
    <select
      id="filter-status"
      className="w-full rounded border px-3 py-2 pr-10 transition-colors duration-150 hover:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer appearance-none bg-[url('data:image/svg+xml;utf8,<svg fill=\'none\' stroke=\'%234B5563\' stroke-width=\'2\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'><path stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19 9l-7 7-7-7\'></path></svg>')] bg-no-repeat bg-[right_0.75rem_center] bg-[length:1.25em_1.25em]"
      value={filterStatus}
      onChange={e => setFilterStatus(e.target.value)}
      aria-label="Filter by status"
    >
      <option className="cursor-pointer hover:bg-blue-50" value="">All Statuses</option>
      {statusOptions.map(status => (
        <option
          key={status}
          className="cursor-pointer hover:bg-blue-50"
          value={status}
        >
          {status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  </div>
)}
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button
               type="button"
               className="rounded px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 transition-colors duration-150 border border-blue-600 cursor-pointer"
               onClick={() => setFiltersOpen(false)}
             >
               Apply
             </button>
             <button
               type="button"
               className="rounded px-4 py-2 bg-gray-100 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400 text-gray-700 transition-colors duration-150 border border-gray-200 cursor-pointer"
               onClick={() => {
                 setFilterDate("");
                 setFilterDepartment("");
                 setFilterCategory("");
                 setFilterQuarters([]);
                 setFilterCreatedBy([]);
                 setFilterOwners([]);
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
        <ConfirmModal
          open={deleteConfirm.open}
          title={deleteConfirm.okr.status === 'deleted' ? 'Permanently Delete OKR?' : 'Delete OKR?'}
          message={
            deleteConfirm.okr.status === 'deleted'
              ? (
                  <>
                    Are you sure you want to <b>permanently delete</b> <span className="font-semibold">{deleteConfirm.okr.objective}</span>? <b>This action cannot be undone.</b>
                  </>
                )
              : (
                  <>
                    Are you sure you want to delete <span className="font-semibold">{deleteConfirm.okr.objective}</span>? You can restore this OKR later from the Deleted tab.
                  </>
                )
          }
          confirmText={deleteConfirm.okr && deleteConfirm.okr.status === 'deleted' && typeof deleteConfirm.okr.objective === 'string' && deleteConfirm.okr.objective.length > 0 ? deleteConfirm.okr.objective : undefined}
          confirmPlaceholder={deleteConfirm.okr && deleteConfirm.okr.status === 'deleted' ? deleteConfirm.okr.objective : undefined}
          confirmButtonLabel={deleteConfirm.okr && deleteConfirm.okr.status === 'deleted' ? 'Permanently Delete' : 'Delete'}
          confirmButtonClass={'bg-red-600 hover:bg-red-700'}
          warning={!!(deleteConfirm.okr && deleteConfirm.okr.status === 'deleted')}
          onCancel={() => setDeleteConfirm({ okr: null, open: false, confirmText: '' })}
          onConfirm={async () => {
            if (deleteConfirm.okr && deleteConfirm.okr.status === 'deleted') {
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
            } else {
              confirmDeleteOkr();
            }
          }}
        />
      )}

      {/* Dialog for Add/Edit OKR */}
      {dialogOpen && (
        <OkrDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditOkr(null);
          }}
          onSave={editOkr ? (okr => {
            // Create a proper OkrUpdatePayload object with only the expected fields
            const updatePayload = {
              _id: editOkr._id,
              objective: okr.objective,
              description: okr.description,
              category: okr.category,
              owners: okr.owners,
              startDate: okr.startDate,
              endDate: okr.endDate,
              keyResults: okr.keyResults,
              department: okr.department,
              status: okr.status as 'on_track' | 'off_track' | 'at_risk' | 'completed'
            };
            handleUpdateOkr(updatePayload);
          }) : handleAddOkr}
          initialData={editOkr ? {
            _id: editOkr._id,
            objective: editOkr.objective,
            description: editOkr.description,
            category: editOkr.category === 'Team' || editOkr.category === 'Individual' ? editOkr.category : undefined,
            owners: editOkr.owners,
            startDate: editOkr.startDate,
            endDate: editOkr.endDate,
            keyResults: editOkr.keyResults,
            department: editOkr.department,
            status: (['on_track', 'off_track', 'at_risk', 'completed'].includes(editOkr.status as string) 
              ? editOkr.status as 'on_track' | 'off_track' | 'at_risk' | 'completed'
              : 'on_track'
            )
          } : undefined}
        />
      )}
      {/* Main page content starts here */}
      {/* Timeline log: Refactored to use Radix UI Tabs for accessibility, modularity, and robust feedback (2025-05-23, see DEVELOPMENT_TIMELINE.md) */}
      <RadixTabs.Root value={tab} onValueChange={setTab} className="w-full">
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
                      createdBy={okr.createdByName}
                      createdByAvatarUrl={okr.createdByAvatarUrl}
                      createdByInitials={okr.createdByInitials}
                      goalType={okr.goalType}
                      department={okr.department}
                      slug={okr.slug || generateSlug(okr.objective || 'okr')}  // Generate slug if missing
                      _id={okr._id || ''}
                      startDate={okr.startDate}
                      endDate={okr.endDate} 
                    />
                    <div className="absolute top-2 right-2">
                      <OkrCardMenu
                        status={okr.status as 'active' | 'archived' | 'deleted'}
                        onEdit={() => handleEditOkr(okr)}
                        onDuplicate={() => handleDuplicateOkr(okr)}
                        onArchive={['active', 'on_track', 'off_track', 'at_risk', 'completed'].includes(okr.status) ? () => {
                          handleUpdateOkr({ ...okr, status: 'archived' }, okr.status);
                        } : undefined}
                        onDelete={okr.status === 'archived' ? () => handleDeleteOkr(okr) : undefined}
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
            onRestore={(okr) => {
              handleUpdateOkr({ ...okr, status: 'active' }, okr.status);
              // Redirect to All OKRs tab after successful unarchive
              setTimeout(() => setTab('all'), 100);
            }}
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