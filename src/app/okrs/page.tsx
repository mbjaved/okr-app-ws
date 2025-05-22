"use client";
// OKRs Page - Scaffold
// Best Practices: Modular component, timeline logging, design prompt reference

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { OkrCard } from "../../components/okr/OkrCard";
import { OkrDialog } from "../../components/okr/OkrDialog";
import { Menu, MenuItem } from "../../components/ui/Menu";
// Modular Pagination (Best_Practices.md, Design_Prompts)
import { Pagination } from "../../components/ui/pagination";

// Simple Toast component for feedback
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded shadow-lg flex items-center gap-2 ${type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}>
      <span>{message}</span>
      <button className="ml-2 text-lg font-bold" onClick={onClose} aria-label="Close toast">×</button>
    </div>
  );
}

import { ObjectId } from "mongodb";

interface Okr {
  _id: string;
  userId?: string;
  objective: string;
  description?: string;
  keyResults: any[];
  departmentId?: string | { _id: string; name: string };
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  // Step 2: Add optional owner for robust UI (Best_Practices.md)
  owner?: string;
}

export default function OKRsPage() {
  // Pagination best practices (Best_Practices.md)
  const OKRS_PER_PAGE = 8;
  const [currentPageAll, setCurrentPageAll] = useState<number>(1);
  const [currentPageArchived, setCurrentPageArchived] = useState<number>(1);

  // --- All useState hooks should come first (Best_Practices.md) ---
  const [okrs, setOkrs] = useState<Okr[]>([]);
  const [archivedOkrs, setArchivedOkrs] = useState<Okr[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOkr, setEditOkr] = useState<Okr | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ okr: Okr | null, open: boolean }>({ okr: null, open: false });
  const [tabValue, setTabValue] = useState("all");
  
  // Controlled Tabs state
  

  // --- Derived filtered and paginated arrays (Best_Practices.md) ---
  const filteredOkrs: Okr[] = okrs.filter(okr => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    const owner = (okr.userId && typeof okr.userId === 'string') ? okr.userId : '';
    return (
      okr.objective.toLowerCase().includes(search) ||
      owner.toLowerCase().includes(search)
    );
  }).sort((a, b) => {
    if (sortBy === 'recent') {
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    } else if (sortBy === 'alpha') {
      return a.objective.localeCompare(b.objective);
    } else if (sortBy === 'created') {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    }
    return 0;
  });

  const paginatedOkrs: Okr[] = filteredOkrs.slice((currentPageAll - 1) * OKRS_PER_PAGE, currentPageAll * OKRS_PER_PAGE);

  const filteredArchivedOkrs: Okr[] = archivedOkrs.filter(okr => {
    const search = searchTerm.trim().toLowerCase();
    if (!search) return true;
    const owner = (okr.userId && typeof okr.userId === 'string') ? okr.userId : '';
    return (
      okr.objective.toLowerCase().includes(search) ||
      owner.toLowerCase().includes(search)
    );
  }).sort((a, b) => {
    if (sortBy === 'recent') {
      return (b.updatedAt || '').localeCompare(a.updatedAt || '');
    } else if (sortBy === 'alpha') {
      return a.objective.localeCompare(b.objective);
    } else if (sortBy === 'created') {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    }
    return 0;
  });

  const paginatedArchivedOkrs: Okr[] = filteredArchivedOkrs.slice((currentPageArchived - 1) * OKRS_PER_PAGE, currentPageArchived * OKRS_PER_PAGE);

  // Auth Wall: Only allow access if authenticated
  const { data: session, status } = useSession();
  const router = useRouter();

  // All hooks must be called before any conditional return (React Rules of Hooks)
  
  
  
  
  
  
  
  
  // Controlled Tabs state
  
  // Step 1: Add controlled state for search and sort (Design_Prompts, Best_Practices.md)
  
  

  // All useEffect hooks must be at the top before any conditional return
  // Best_Practices.md: Only fetch OKRs after session is loaded and user is authenticated
useEffect(() => {
  if (status === "unauthenticated") {
    router.replace('/login');
    return;
  }
  if (status === "authenticated") {
    fetchOkrs();
  }
}, [status, router]);

  const fetchOkrs = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/okrs");
      if (!res.ok) throw new Error("Failed to fetch OKRs");
      const data = await res.json();
      setOkrs(data.filter((okr: Okr) => okr.status !== "archived"));
      setArchivedOkrs(data.filter((okr: Okr) => okr.status === "archived"));
    } catch (err: any) {
      setError(err.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOkrs();
  }, []);


  const handleAddOkr = async (okr: any) => {
    try {
      const res = await fetch("/api/okrs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(okr)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create OKR");
      }
      setToast({ message: "OKR created successfully!", type: "success" });
      setDialogOpen(false);
      setEditOkr(null);
      fetchOkrs();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to create OKR", type: "error" });
      console.error("[Add OKR]", err);
    }
  };

  const handleEditOkr = (okr: Okr) => {
    console.log('[OKRsPage] handleEditOkr called with:', okr);
    setEditOkr(okr);
    setDialogOpen(true);
  };

  // Step 2: Duplicate OKR logic (Design_Prompts, Best_Practices.md)
  const handleDuplicateOkr = async (okr: Okr) => {
    try {
      // Remove _id, createdAt, updatedAt, and set status to 'active'
      const { _id, createdAt, updatedAt, status, ...rest } = okr;
      const duplicate = {
        ...rest,
        status: 'active',
        // Optionally, append '(Copy)' to the objective for clarity
        objective: okr.objective + ' (Copy)'
      };
      // Debug log for timeline
      console.log('[OKRsPage] Duplicating OKR:', duplicate);
      // Timeline log (Best_Practices.md)
      // TODO: Append to DEVELOPMENT_TIMELINE.md: `Duplicated OKR: ${okr.objective}`
      await handleAddOkr(duplicate);
      setToast({ message: 'OKR duplicated successfully!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'Failed to duplicate OKR', type: 'error' });
      console.error('[OKRsPage] Duplicate failed', err);
    }
  };


  const handleUpdateOkr = async (okr: any) => {
    try {
      const res = await fetch(`/api/okrs/${okr._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(okr)
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update OKR");
      }
      // Only show archive/unarchive messages if status changed, else show update message
const prevStatus = editOkr?.status;
if (prevStatus && okr.status !== prevStatus) {
  setToast({ message: okr.status === "active" ? "OKR unarchived successfully!" : okr.status === "archived" ? "OKR archived successfully!" : "OKR updated successfully!", type: "success" });
} else {
  setToast({ message: "OKR updated successfully!", type: "success" });
}
      setDialogOpen(false);
      setEditOkr(null);
      fetchOkrs();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to update OKR", type: "error" });
      console.error("[Edit OKR]", err);
    }
  };


  const handleDeleteOkr = (okr: Okr) => {
    setDeleteConfirm({ okr, open: true });
  };

  const confirmDeleteOkr = async () => {
    if (!deleteConfirm.okr) return;
    try {
      const res = await fetch(`/api/okrs/${deleteConfirm.okr._id}`, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to delete OKR");
      }
      setToast({ message: "OKR deleted successfully!", type: "success" });
      setDeleteConfirm({ okr: null, open: false });
      fetchOkrs();
    } catch (err: any) {
      setToast({ message: err.message || "Failed to delete OKR", type: "error" });
      setDeleteConfirm({ okr: null, open: false });
    }
  };

  return (
    <main className="container mx-auto py-8">
      <header className="flex items-center justify-between mb-6 px-4">
  <h1 className="text-3xl font-bold">OKRs</h1>
  <Button variant="primary" className="ml-4" onClick={() => setDialogOpen(true)}>Add OKR</Button>
</header>
      {dialogOpen && (
        <OkrDialog
          open={dialogOpen}
          onClose={() => {
            setDialogOpen(false);
            setEditOkr(null);
          }}
          onSave={okrUpdate => {
            if (editOkr && editOkr._id) {
              handleUpdateOkr({ ...editOkr, ...okrUpdate });
            } else {
              handleUpdateOkr(okrUpdate);
            }
          }}
          initialData={editOkr || undefined}
        />
      )}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      {deleteConfirm.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded shadow-lg p-6 max-w-sm w-full">
            <div className="mb-4">Are you sure you want to delete this OKR?</div>
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300" onClick={() => setDeleteConfirm({ okr: null, open: false })}>Cancel</button>
              <button className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600" onClick={confirmDeleteOkr}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Controlled Tabs to fix setValue error */}
      {/*
        Design Reference: See Design_Prompts/3.txt (Tabs, Search, Sort controls)
        Best Practices: Accessibility, modularity, robust UI feedback, timeline logging, design prompt reference (Best_Practices.md)
      */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 px-2">
        <label htmlFor="okr-search" className="sr-only">Search OKRs</label>
        <input
          id="okr-search"
          type="text"
          placeholder="Search OKRs..."
          className="border rounded px-3 py-2 w-full md:w-72"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          aria-label="Search OKRs by objective or owner"
        />
        <div className="flex items-center gap-2 ml-auto">
          <label htmlFor="okr-sort" className="font-medium mr-2">Sort By</label>
          <select
            id="okr-sort"
            className="border rounded px-3 py-2"
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            aria-label="Sort OKRs"
          >
            <option value="recent">Recently Updated</option>
            <option value="alpha">Alphabetically</option>
            <option value="created">Creation Date</option>
          </select>
        </div>
      </div>
      <Tabs value={tabValue} onValueChange={setTabValue} className="mb-4">
        <TabsList>
          <TabsTrigger tabValue="all">All OKRs</TabsTrigger>
<TabsTrigger tabValue="archived">Archived OKRs</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {loading && <div className="text-center py-8">Loading OKRs...</div>}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}
          {!loading && !error && paginatedOkrs.length === 0 && (
            <div className="text-center text-gray-400 py-8">No OKRs yet. Add your first one!</div>
          )}
          {/* Pagination Controls (Design_Prompts, Best_Practices.md) */}
          <Pagination
            currentPage={currentPageAll}
            totalPages={Math.ceil(filteredOkrs.length / OKRS_PER_PAGE)}
            onPageChange={setCurrentPageAll}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedOkrs.map((okr) => (
              <div key={okr._id} className="relative group">
                <OkrCard
                  objective={okr.objective}
                  dueDate={okr.endDate ? okr.endDate.slice(0, 10) : "-"}
                  status={okr.status}
                  keyResults={okr.keyResults}
                  lastUpdated={okr.updatedAt?.slice(0, 10) || "-"}
                  // Step 2: Pass owner to OkrCard (Design_Prompts, Best_Practices.md)
                  owner={okr.owner || (typeof okr.userId === 'string' ? okr.userId : undefined)}
                />
                <div className="absolute top-2 right-2">
                  <Menu
                    trigger={
                      <button className="p-1 rounded-full bg-gray-100 hover:bg-blue-100 text-blue-700 shadow-sm border border-gray-200 focus:outline-none transition-colors" aria-label="OKR actions">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                    }
                  >
                    <MenuItem onClick={() => handleEditOkr(okr)}>
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z" /></svg>
                        Edit
                      </span>
                    </MenuItem>
                    {/* Step 2: Duplicate action (Design_Prompts, Best_Practices.md) */}
                    <MenuItem onClick={() => handleDuplicateOkr(okr)}>
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="12" height="12" rx="2"/></svg>
                        Duplicate
                      </span>
                    </MenuItem>
                    {okr.status !== "archived" && (
                      <MenuItem onClick={() => handleUpdateOkr({ ...okr, status: "archived" })}>
                        <span className="flex items-center gap-2">
                          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" /></svg>
                          Archive
                        </span>
                      </MenuItem>
                    )}
                    {okr.status === "archived" && (
                      <>
                        <MenuItem onClick={() => handleUpdateOkr({ ...okr, status: "active" })}>
                          <span className="flex items-center gap-2 text-blue-700">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12" /></svg>
                            Unarchive
                          </span>
                        </MenuItem>
                        <MenuItem onClick={() => handleDeleteOkr(okr)}>
                          <span className="flex items-center gap-2 text-red-600">
                            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                            Delete
                          </span>
                        </MenuItem>
                      </>
                    )}
                  </Menu>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="archived">
          {loading && <div className="text-center py-8">Loading OKRs...</div>}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}
          {!loading && !error && paginatedArchivedOkrs.length === 0 && (
            <div className="text-center text-gray-400 py-8">No archived OKRs</div>
          )}
          {/* Pagination Controls (Design_Prompts, Best_Practices.md) */}
          <Pagination
            currentPage={currentPageArchived}
            totalPages={Math.ceil(filteredArchivedOkrs.length / OKRS_PER_PAGE)}
            onPageChange={setCurrentPageArchived}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {paginatedArchivedOkrs.map((okr) => (
              <div key={okr._id} className="relative">
                <OkrCard
                  objective={okr.objective}
                  dueDate={okr.endDate ? okr.endDate.slice(0, 10) : "-"}
                  status={okr.status}
                  keyResults={okr.keyResults}
                  lastUpdated={okr.updatedAt ? okr.updatedAt.slice(0, 10) : "-"}
                  // Step 2: Pass owner to OkrCard (Design_Prompts, Best_Practices.md)
                  owner={okr.owner || (typeof okr.userId === 'string' ? okr.userId : undefined)}
                />
                <div className="absolute top-2 right-2">
                  <Menu
                    trigger={
                      <button className="p-1 rounded-full bg-gray-100 hover:bg-blue-100 text-blue-700 shadow-sm border border-gray-200 focus:outline-none transition-colors" aria-label="OKR actions">
                        <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <circle cx="12" cy="5" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="19" r="2" />
                        </svg>
                      </button>
                    }
                  >
                    <MenuItem onClick={() => handleEditOkr(okr)}>
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.536-6.536a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4 1a1 1 0 01-1.263-1.263l1-4a4 4 0 01.828-1.414z" /></svg>
                        Edit
                      </span>
                    </MenuItem>
                    {/* Step 2: Duplicate action (Design_Prompts, Best_Practices.md) */}
                    <MenuItem onClick={() => handleDuplicateOkr(okr)}>
                      <span className="flex items-center gap-2">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="8" y="8" width="12" height="12" rx="2"/></svg>
                        Duplicate
                      </span>
                    </MenuItem>
                    <MenuItem onClick={() => {
                      const okrToUpdate = { ...okr, status: "active" };
                      if (okrToUpdate.departmentId === "") delete okrToUpdate.departmentId;
                      handleUpdateOkr(okrToUpdate);
                    }}>
                      <span className="flex items-center gap-2 text-blue-700">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4v12" /></svg>
                        Unarchive
                      </span>
                    </MenuItem>
                    <MenuItem onClick={() => handleDeleteOkr(okr)}>
                      <span className="flex items-center gap-2 text-red-600">
                        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>
                        Delete
                      </span>
                    </MenuItem>
                  </Menu>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}
