"use client";
import React from "react";
import { useRouter } from "next/navigation";
import { OkrCardMenu } from "../../../components/okr/OkrCardMenu";
import { ConfirmModal } from "../../../components/ui/ConfirmModal";
import { OkrDetailsEditDialog } from "./OkrDetailsEditDialog.client";

interface OkrDetailsActionsProps {
  okr: any;
}

export const OkrDetailsActions: React.FC<OkrDetailsActionsProps> = ({ okr }) => {
  const [confirmModal, setConfirmModal] = React.useState<{
    type: null | 'restore' | 'hardDelete' | 'delete',
    open: boolean
  }>({ type: null, open: false });
  const [pending, setPending] = React.useState(false);
  const router = useRouter();
  // --- Edit OKR Dialog State ---
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editOkr, setEditOkr] = React.useState<any>(null);

  // Handler: Edit
  const handleEdit = () => {
    // Use enrichOwnersWithUserData to map owners as in All OKRs tab
    const ownersArray = okr.owners && okr.owners.length > 0
      ? okr.owners
      : okr.owner
        ? [okr.owner]
        : [];
    setEditOkr({ ...okr, owners: ownersArray });
    setEditDialogOpen(true);
  };

  // Handler: Save Edit
  const handleSaveEdit = async (updated: any) => {
    try {
      const res = await fetch(`/api/okrs/${okr._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error(await res.text());
      setEditDialogOpen(false);
      setEditOkr(null);
      // Optionally: refetch or update local state here if needed
      window.location.reload(); // simplest way to reflect changes on details page
    } catch (err: any) {
      alert('Error saving OKR: ' + (err.message || err));
    }
  };

  // Handler: Duplicate
  const handleDuplicate = async () => {
    try {
      const { _id, createdAt, updatedAt, status, ...rest } = okr;
      const validCategory = okr.category === 'Individual' || okr.category === 'Team' ? okr.category : 'Individual';
      // Map owners to string IDs
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
      } else if (typeof window !== 'undefined') {
        const sessionUserId = sessionStorage.getItem('okr_user_id');
        if (sessionUserId) ownersArray = [sessionUserId];
      }
      // Fallback: if still empty, use current user
      if (!ownersArray.length && typeof window !== 'undefined') {
        const sessionUserId = sessionStorage.getItem('okr_user_id');
        if (sessionUserId) ownersArray = [sessionUserId];
      }
      // Handle category-specific logic
      if (validCategory === 'Individual') {
        ownersArray = ownersArray.filter(Boolean).slice(0, 1);
      } else {
        ownersArray = ownersArray.filter(id => typeof id === 'string' && !!id);
      }
      // Build duplicate payload
      const duplicate = {
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
      };
      // POST to create duplicate OKR
      const res = await fetch('/api/okrs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(duplicate),
      });
      if (!res.ok) throw new Error(await res.text());
      // After duplicate, navigate to All OKRs tab
      router.push('/okrs');
    } catch (err: any) {
      alert('Error duplicating OKR: ' + (err.message || err));
    }
  };

  // Handler: Archive (Soft)
  const handleArchive = async () => {
    try {
      const res = await fetch(`/api/okrs/${okr._id}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' })
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/okrs?tab=archived");
    } catch (err: any) {
      alert("Error archiving OKR: " + (err.message || err));
    }
  };


  // Handler: Delete (Soft)
  const handleDelete = () => {
    setConfirmModal({ type: 'delete', open: true });
  };
  const doDelete = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/okrs/${okr._id}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'deleted' })
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/okrs?tab=deleted");
    } catch (err: any) {
      alert("Error deleting OKR: " + (err.message || err));
    } finally {
      setPending(false);
      setConfirmModal({ type: null, open: false });
    }
  };
  // Handler: Restore
  const handleRestore = () => {
    setConfirmModal({ type: 'restore', open: true });
  };
  const doRestore = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/okrs/${okr._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "active" })
      });
      if (!res.ok) throw new Error(await res.text());
      router.push("/okrs?tab=all");
    } catch (err: any) {
      alert("Error restoring OKR: " + (err.message || err));
    } finally {
      setPending(false);
      setConfirmModal({ type: null, open: false });
    }
  };
  // Handler: Hard Delete
  const handleHardDelete = () => {
    setConfirmModal({ type: 'hardDelete', open: true });
  };
  const doHardDelete = async () => {
    setPending(true);
    try {
      const res = await fetch(`/api/okrs/${okr._id}?hard=true`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      router.push("/okrs?tab=deleted");
    } catch (err: any) {
      alert("Error permanently deleting OKR: " + (err.message || err));
    } finally {
      setPending(false);
      setConfirmModal({ type: null, open: false });
    }
  };
  return (
    <>
      <div className="flex gap-2">
        <OkrCardMenu
          status={okr.status}
          onEdit={handleEdit}
          onDuplicate={handleDuplicate}
          onArchive={okr.status === 'active' ? handleArchive : undefined}
          onDelete={okr.status === 'archived' ? handleDelete : undefined}
          onRestore={okr.status === 'deleted' ? handleRestore : undefined}
          onHardDelete={okr.status === 'deleted' ? handleHardDelete : undefined}
        />
      </div>
      {/* Unified ConfirmModal for delete and hard delete (DRY, matches Deleted OKRs tab) */}
      {confirmModal.open && (
        <ConfirmModal
          open={confirmModal.open}
          title={confirmModal.type === 'hardDelete' ? 'Permanently Delete OKR?' : confirmModal.type === 'delete' ? 'Delete OKR?' : 'Restore OKR?'}
          message={
            confirmModal.type === 'hardDelete' ? (
              <>
                Are you sure you want to <b>permanently delete</b> <span className="font-semibold">{okr.objective}</span>? <b>This action cannot be undone.</b>
              </>
            ) : confirmModal.type === 'delete' ? (
              <>
                Are you sure you want to delete <span className="font-semibold">{okr.objective}</span>? <b>This OKR will be moved to the Deleted tab and can be restored later.</b>
              </>
            ) : (
              <>Are you sure you want to restore this OKR? It will be moved back to the All OKRs tab.</>
            )
          }
          // Only require typing for hard delete
          confirmText={confirmModal.type === 'hardDelete' && typeof okr.objective === 'string' && okr.objective.length > 0 ? okr.objective : undefined}
          confirmPlaceholder={confirmModal.type === 'hardDelete' ? okr.objective : undefined}
          confirmButtonLabel={confirmModal.type === 'hardDelete' ? 'Permanently Delete' : confirmModal.type === 'delete' ? 'Delete' : 'Restore'}
          confirmButtonClass={confirmModal.type === 'hardDelete' ? 'bg-red-600 hover:bg-red-700' : confirmModal.type === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}
          warning={confirmModal.type === 'hardDelete'}
          onCancel={() => setConfirmModal({ type: null, open: false })}
          onConfirm={async () => {
            if (confirmModal.type === 'hardDelete') {
              await doHardDelete();
            } else if (confirmModal.type === 'delete') {
              await doDelete();
            } else if (confirmModal.type === 'restore') {
              await doRestore();
            }
          }}
        />
      )}
      {editDialogOpen && editOkr && (
        <OkrDetailsEditDialog
          open={editDialogOpen}
          okr={editOkr}
          onClose={() => { setEditDialogOpen(false); setEditOkr(null); }}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

