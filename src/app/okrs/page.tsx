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
}

export default function OKRsPage() {
  // Auth Wall: Only allow access if authenticated
  const { data: session, status } = useSession();
  const router = useRouter();

  // All hooks must be called before any conditional return (React Rules of Hooks)
  const [okrs, setOkrs] = useState<Okr[]>([]);
  const [archivedOkrs, setArchivedOkrs] = useState<Okr[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editOkr, setEditOkr] = useState<Okr | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ okr: Okr | null, open: boolean }>({ okr: null, open: false });
  // Controlled Tabs state
  const [tabValue, setTabValue] = useState("all");

  // All useEffect hooks must be at the top before any conditional return
  useEffect(() => {
    if (status === "unauthenticated") {
      if (typeof window !== "undefined") {
        router.replace(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      } else {
        router.replace("/login");
      }
    }
  }, [status, router]);

  useEffect(() => {
    fetchOkrs();
  }, []);

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
    setEditOkr(okr);
    setDialogOpen(true);
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
      setToast({ message: okr.status === "active" ? "OKR unarchived successfully!" : okr.status === "archived" ? "OKR archived successfully!" : "OKR updated successfully!", type: "success" });
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
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">OKRs</h1>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>Add OKR</Button>
      </header>
      <OkrDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={async okr => {
          // Best Practice: Only close modal and show toast after save completes
          console.log('[page.tsx] onSave called with:', okr);
          try {
            if (editOkr && editOkr._id) {
              await handleUpdateOkr({ ...editOkr, ...okr, _id: editOkr._id });
            } else {
              await handleAddOkr(okr);
            }
            setDialogOpen(false);
            setEditOkr(null);
            setToast({ message: 'OKR saved successfully!', type: 'success' });
          } catch (err) {
            setToast({ message: 'Failed to save OKR', type: 'error' });
            throw err; // So dialog can re-enable Save button
          }
        }}
        initialData={editOkr}
      />
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
      <Tabs value={tabValue} onValueChange={setTabValue} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All OKRs</TabsTrigger>
          <TabsTrigger value="archived">Archived OKRs</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          {loading && <div className="text-center py-8">Loading OKRs...</div>}
          {error && <div className="text-center text-red-500 py-8">{error}</div>}
          {!loading && !error && okrs.length === 0 && (
            <div className="text-center text-gray-400 py-8">No OKRs yet. Add your first one!</div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {okrs.map((okr) => (
              <div key={okr._id} className="relative group">
                <OkrCard
                  objective={okr.objective}
                  dueDate={okr.endDate ? okr.endDate.slice(0, 10) : "-"}
                  status={okr.status}
                  keyResults={okr.keyResults}
                  lastUpdated={okr.updatedAt?.slice(0, 10) || "-"}
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
          {!loading && !error && archivedOkrs.length === 0 && (
            <div className="text-center text-gray-400 py-8">No archived OKRs</div>
          )}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {archivedOkrs.map((okr) => (
              <div key={okr._id} className="relative">
                <OkrCard
                  objective={okr.objective}
                  dueDate={okr.endDate ? okr.endDate.slice(0, 10) : "-"}
                  status={okr.status}
                  keyResults={okr.keyResults}
                  lastUpdated={okr.updatedAt ? okr.updatedAt.slice(0, 10) : "-"}
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
