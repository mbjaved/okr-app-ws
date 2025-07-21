// OkrTabPanel.tsx
// Best Practices: Modular, accessible, design prompt reference, minimal code duplication
import React from "react";
import { Pagination } from "../ui/pagination";
import { OkrCard } from "./OkrCard";
import { OkrCardMenu } from "./OkrCardMenu";
import { EmptyState } from "./EmptyState";
import { enrichOwnersWithUserData } from "../../lib/enrichOwnersWithUserData";
// TODO: Replace with import from shared types module if available
interface Okr {
  _id: string;
  userId?: string;
  objective: string;
  description?: string;
  keyResults: any[];
  category?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
  owner?: string;
  // New owners field for multi-owner support
  owners?: Array<{ _id: string; name?: string; avatarUrl?: string }>;
  goalType?: string;
  department?: string;
  // Added for avatar consistency
  createdBy?: string;
  createdByAvatarUrl?: string;
  createdByInitials?: string;
  slug?: string;
}

interface OkrTabPanelProps {
  okrs: Okr[];
  users: { _id: string; name?: string; avatarUrl?: string }[];
  loading: boolean;
  error: string | null;
  emptyState: { svg: React.ReactNode; message: string };
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onEdit: (okr: Okr) => void;
  onDuplicate: (okr: Okr) => void;
  onArchive?: (okr: Okr) => void;
  onRestore?: (okr: Okr) => void;
  onDelete?: (okr: Okr) => void;
  onHardDelete?: (okr: Okr) => void;
  tabRole: string;
}

export const OkrTabPanel: React.FC<OkrTabPanelProps> = ({
  okrs,
  users,
  loading,
  error,
  emptyState,
  currentPage,
  totalPages,
  onPageChange,
  onEdit,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
  onHardDelete,
  tabRole,
}) => {
  return (
    <div className="focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400" tabIndex={0} aria-label={tabRole}>
      {loading && <div className="text-center py-8">Loading OKRs...</div>}
      {error && <div className="text-center text-red-500 py-8">{error}</div>}
      {!loading && !error && okrs.length === 0 && (
        <EmptyState svg={emptyState.svg} message={emptyState.message} />
      )}
      {(!loading && !error && okrs.length > 0) && (
        <div className="flex flex-col gap-4">
          {okrs.map((okr) => (
            <div key={okr._id} className="relative">
              <OkrCard
                objective={okr.objective}
                dueDate={okr.endDate ? okr.endDate.slice(0, 10) : "-"}
                status={okr.status}
                keyResults={okr.keyResults}
                lastUpdated={okr.updatedAt ? okr.updatedAt.slice(0, 10) : "-"}
                // Support both legacy single owner and new multiple owners array
                owner={okr.owner || (typeof okr.userId === 'string' ? okr.userId : undefined)}
                // Pass owners array if available
                owners={enrichOwnersWithUserData(okr.owners || [], users)}
                description={okr.description}
                createdBy={okr.createdBy}
                createdByAvatarUrl={okr.createdByAvatarUrl}
                createdByInitials={okr.createdByInitials}
                goalType={okr.goalType}
                department={okr.department}
                slug={okr.slug || ''}
                _id={okr._id}
              />
              <div className="absolute top-2 right-2">
                <OkrCardMenu
                  status={okr.status as 'active' | 'archived' | 'deleted'}
                  onEdit={() => onEdit(okr)}
                  onDuplicate={() => onDuplicate(okr)}
                  onArchive={onArchive ? () => onArchive(okr) : undefined}
                  onDelete={onDelete ? () => onDelete(okr) : undefined}
                  onRestore={onRestore ? () => onRestore(okr) : undefined}
                  onHardDelete={onHardDelete ? () => onHardDelete(okr) : undefined}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};
