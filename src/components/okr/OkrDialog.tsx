import React, { useEffect, useState, useRef } from "react";
import { enrichOwnersWithUserData } from "../../lib/enrichOwnersWithUserData";
import { Button } from "../ui/button";
import { MultiSelect, MultiSelectOption } from "../ui/MultiSelect";

interface Department {
  _id: string;
  name: string;
}

interface KeyResultPercent {
  krId: string;
  title: string;
  type: 'percent';
  progress: number;
  assignedTo?: string[];
}
interface KeyResultTarget {
  krId: string;
  title: string;
  type: 'target';
  current: number;
  target: number;
  unit?: string;
  assignedTo?: string[];
}
type KeyResult = KeyResultPercent | KeyResultTarget;

type OwnerData = {
  _id: string;
  name?: string;
  avatarUrl?: string;
};

type OkrUpdatePayload = {
  _id?: string;
  objective?: string;
  description?: string;
  category?: "Individual" | "Team";
  owners?: OwnerData[];
  startDate?: string;
  endDate?: string;
  keyResults?: KeyResult[];
  status?: "on_track" | "at_risk" | "off_track" | "completed";
};

interface OkrDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (okr: OkrUpdatePayload) => void;
  initialData?: OkrUpdatePayload;
}

export const OkrDialog: React.FC<OkrDialogProps> = ({ open, onClose, onSave, initialData }) => {
  // State
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<"Individual" | "Team">("Individual");
  const [status, setStatus] = useState<"on_track" | "at_risk" | "off_track" | "completed">("on_track");
  const [owners, setOwners] = useState<string[]>([]);
  const [ownersData, setOwnersData] = useState<OwnerData[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [users, setUsers] = useState<MultiSelectOption[]>([]);
  const [usersError, setUsersError] = useState("");

  // Sync state from initialData
  // Owners prefill: ensure owners/ownersData are set only after users are loaded and mapped
  // Utility for deep equality (for arrays of primitives or objects)
  function deepEqual(a: any, b: any) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  // Track last synced owners to prevent unnecessary resets
  const lastSyncedOwnersRef = React.useRef<string[]>([]);
  useEffect(() => {
    if (!open || !initialData || users.length === 0) return;
    // Use centralized utility for all owner mapping and enrichment
    const mappedOwners = enrichOwnersWithUserData(
      initialData.owners && initialData.owners.length > 0
        ? initialData.owners
        : initialData.owner
          ? [initialData.owner]
          : [],
      users
    );
    const mappedOwnerIds = mappedOwners.map(o => o._id);
    // Fallback: If no valid owners, use current user
    if (mappedOwnerIds.length === 0) {
      const sessionUserId = sessionStorage.getItem('okr_user_id');
      const u = users.find(u => u.value === sessionUserId);
      if (sessionUserId && u) {
        mappedOwnerIds.push(sessionUserId);
        mappedOwners.push({ _id: sessionUserId, name: u.label, avatarUrl: u.avatarUrl });
      }
    }
    // Only update if owners have changed since last sync
    if (!deepEqual(lastSyncedOwnersRef.current, mappedOwnerIds)) {
      setOwners(mappedOwnerIds);
      setOwnersData(mappedOwners);
      lastSyncedOwnersRef.current = mappedOwnerIds;
    }
    setObjective(typeof initialData?.objective === 'string' ? initialData.objective : "");
    setDescription(typeof initialData?.description === 'string' ? initialData.description : "");
    if (initialData?.category && ["Individual", "Team"].includes(initialData.category)) {
      setCategory(initialData.category);
    }
    if (initialData?.status && ["on_track", "at_risk", "off_track", "completed"].includes(initialData.status)) {
      setStatus(initialData.status as "on_track" | "at_risk" | "off_track" | "completed");
    } else {
      setStatus("on_track");
    }
    // One-time debug log
    if (open && users.length > 0) {
      // Only log once per dialog open
      if (!(window as any).__okr_debug_logged) {
        (window as any).__okr_debug_logged = true;
        console.log('[OKR DEBUG] initialData.owners:', initialData.owners);
        console.log('[OKR DEBUG] users:', users);
        console.log('[OKR DEBUG] mappedOwners:', mappedOwners);
        console.log('[OKR DEBUG] mappedOwnerIds:', mappedOwnerIds);
        console.log('[OKR DEBUG] MultiSelect value:', owners);
      }
    }
    setStartDate(typeof initialData?.startDate === 'string' ? initialData.startDate.slice(0, 10) : "");
    setEndDate(typeof initialData?.endDate === 'string' ? initialData.endDate.slice(0, 10) : "");
    setKeyResults(Array.isArray(initialData?.keyResults) ? initialData.keyResults : []);
    setErrors({});
    // Reset debug flag on close
    if (!open && (window as any).__okr_debug_logged) (window as any).__okr_debug_logged = false;
  }, [open, initialData, users]);

  useEffect(() => {
    if (open) {
      console.debug('[OkrDialog] Owners state after open:', { owners, ownersData, users });
    }
  }, [open, owners, ownersData, users]);


  // Fetch users for Owners MultiSelect
  useEffect(() => {
    async function fetchUsers() {
      try {
        setUsersError("");
        const res = await fetch("/api/users");
        if (!res.ok) throw new Error("Failed to fetch users");
        const data = await res.json();
        let mappedUsers = data.map((u: any) => ({ value: u._id, label: u.name, avatarUrl: u.avatarUrl }));
        // Patch: Ensure all owners are present in users (for legacy or orphaned users)
        if (initialData && Array.isArray(initialData.owners)) {
          (initialData.owners as any[]).forEach(o => {
            const ownerId = o._id || o.userId || o;
            if (!mappedUsers.some(u => u.value === ownerId)) {
              mappedUsers.push({
                value: ownerId,
                label: o.name || ownerId,
                avatarUrl: o.avatarUrl
              });
            }
          });
        }
        setUsers(mappedUsers);
      } catch (err: any) {
        setUsersError("Could not load users. Please try again later.");
      }
    }
    if (open) fetchUsers();
  }, [open, initialData]);

  // Validation
  function validate() {
    const newErrors: { [key: string]: string } = {};
    if (!objective.trim()) newErrors.objective = "Objective is required";
    if (!owners || owners.length === 0) newErrors.owners = "Select at least one owner";
    if (category === 'Individual' && owners.length > 1) {
      newErrors.owners = "Only one owner is allowed for Individual OKRs.";
    }
    if (!startDate) newErrors.startDate = "Start date is required";
    if (!endDate) newErrors.endDate = "End date is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // Key Results handlers
  const handleAddKR = () => {
    setKeyResults([
      ...keyResults,
      { krId: Date.now().toString(), title: "", type: "percent", progress: 0 } as KeyResult
    ]);
  };
  const handleKRChange = (idx: number, field: string, value: any) => {
    const next = [...keyResults];
    const kr = next[idx];
    if (field === "type") {
      if (value === "percent") {
        next[idx] = { krId: kr.krId, title: kr.title, type: "percent", progress: 0 };
      } else {
        next[idx] = { krId: kr.krId, title: kr.title, type: "target", current: 0, target: 100, unit: "" };
      }
    } else {
      (next[idx] as any)[field] = value;
    }
    setKeyResults(next);
  };

  // Update owners state and sync with ownersData
  const handleOwnersChange = (newOwnerIds: string[]) => {
    // Enforce single owner if category is Individual
    const limitedOwners = category === 'Individual' ? newOwnerIds.slice(0, 1) : newOwnerIds;
    setOwners(limitedOwners);

    // Update ownersData to match the selected IDs
    const newOwnersData = limitedOwners.map(id => {
      // Try to find existing data for this owner
      const existingData = ownersData.find(o => o._id === id);
      if (existingData) return existingData;

      // Try to find user data from users list
      const userData = users.find(u => u.value === id);
      if (userData) {
        return {
          _id: id,
          name: userData.label,
          avatarUrl: userData.avatarUrl
        };
      }

      // Fallback
      return { _id: id };
    });

    setOwnersData(newOwnersData);
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    
    try {
      setSaving(true);
      const payload: OkrUpdatePayload = {
        _id: initialData?._id,
        objective,
        description,
        category,
        status,
        // Send full owner objects with id, name, avatarUrl
        owners: ownersData,
        startDate,
        endDate,
        keyResults,
      };
      
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error("Error saving OKR:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl relative flex flex-col max-h-[90vh]">
        <header className="flex items-center justify-between p-4 border-b">
          <h2 className="text-2xl font-bold">{initialData ? "Edit OKR" : "Add OKR"}</h2>
          <button
            className="text-gray-500 hover:text-red-500 text-xl font-bold"
            onClick={onClose}
            aria-label="Close dialog"
          >
            ×
          </button>
        </header>
        <form className="flex-1 overflow-y-auto p-4 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1">
            <span>Objective <span className="text-red-500">*</span></span>
            <input
              className={`border rounded px-3 py-2 ${errors.objective ? 'border-red-500' : ''}`}
              value={objective}
              onChange={e => setObjective(e.target.value)}
              aria-invalid={!!errors.objective}
              aria-describedby={errors.objective ? 'objective-error' : undefined}
            />
            {errors.objective && (
              <span id="objective-error" className="text-xs text-red-500 mt-1">{errors.objective}</span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            Description
            <textarea
              className="border rounded px-3 py-2"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
            />
          </label>
          {/* Owners MultiSelect (replaces Department) */}
          <div className="flex flex-col gap-1">
            <span>Owners <span className="text-red-500">*</span></span>
            <div className="mb-4">
              {console.log('[OKR DEBUG] MultiSelect props:', { options: users, value: owners })}
              <MultiSelect
                label="Owners"
                options={users}
                value={owners}
                onChange={handleOwnersChange}
                placeholder="Select user(s)"
                isMulti={category !== 'Individual'}
                maxSelected={category === 'Individual' ? 1 : undefined}
                disabled={saving}
              />
              {errors.owners && <div className="text-red-500 text-xs mt-1">{errors.owners}</div>}
            </div>
          </div>
          <label className="flex flex-col gap-1">
            <span>Category</span>
            <select
              className="border rounded px-2 py-1 w-full cursor-pointer"
              value={category}
              onChange={e => setCategory(e.target.value as "Individual" | "Team")}
              aria-invalid={!!errors.category}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <option value="Individual">Individual</option>
              <option value="Team">Team</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span>Status</span>
            <select
              className="border rounded px-2 py-1 w-full cursor-pointer"
              value={status}
              onChange={e => setStatus(e.target.value as "on_track" | "at_risk" | "off_track" | "completed")}
              aria-invalid={!!errors.status}
              aria-describedby={errors.status ? 'status-error' : undefined}
            >
              <option value="on_track">On Track</option>
              <option value="at_risk">At Risk</option>
              <option value="off_track">Off Track</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <div className="flex gap-4">
            <label className="flex-1 flex flex-col gap-1">
              <span>Start Date <span className="text-red-500">*</span></span>
              <input
                type="date"
                className="border rounded px-2 py-1 w-full cursor-pointer"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                aria-invalid={!!errors.startDate}
                aria-describedby={errors.startDate ? 'startdate-error' : undefined}
              />
              {errors.startDate && (
                <span id="startdate-error" className="text-xs text-red-500 mt-1">{errors.startDate}</span>
              )}
            </label>
            <label className="flex-1 flex flex-col gap-1">
              <span>End Date <span className="text-red-500">*</span></span>
              <input
                type="date"
                className="border rounded px-2 py-1 w-full cursor-pointer"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                aria-invalid={!!errors.endDate}
                aria-describedby={errors.endDate ? 'enddate-error' : undefined}
              />
              {errors.endDate && (
                <span id="enddate-error" className="text-xs text-red-500 mt-1">{errors.endDate}</span>
              )}
            </label>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Key Results</span>
              <Button type="button" variant="secondary" onClick={handleAddKR} className="cursor-pointer">Add Key Result</Button>
            </div>
            <div className="flex flex-col gap-2">
              {keyResults.map((kr, idx) => (
                <div key={kr.krId} className="border rounded p-2 flex flex-col gap-2">
                  <input
                    className="border rounded px-2 py-1"
                    placeholder="Key Result Title"
                    value={kr.title}
                    onChange={e => handleKRChange(idx, "title", e.target.value)}
                  />
                  <div className="flex gap-2 items-end">
                    <select
                      className="border rounded px-2 py-1 cursor-pointer"
                      value={kr.type || 'percent'}
                      onChange={e => handleKRChange(idx, "type", e.target.value)}
                    >
                      <option value="percent">Percent (0-100%)</option>
                      <option value="target">Target/Actual</option>
                    </select>
                    {(!kr.type || kr.type === 'percent') && (
                      <>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          className="border rounded px-2 py-1 w-24"
                          placeholder="Progress %"
                          value={kr.progress ?? 0}
                          onChange={e => handleKRChange(idx, "progress", Math.max(0, Math.min(100, Number(e.target.value))))}
                        />
                        <span className="text-xs">%</span>
                      </>
                    )}
                    {kr.type === 'target' && (
                      <>
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-20"
                          placeholder="Current"
                          value={kr.current ?? 0}
                          onChange={e => handleKRChange(idx, "current", Number(e.target.value))}
                        />
                        <span className="text-xs">/</span>
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-20"
                          placeholder="Target"
                          value={kr.target ?? 100}
                          onChange={e => handleKRChange(idx, "target", Number(e.target.value))}
                        />
                        <input
                          type="text"
                          className="border rounded px-2 py-1 w-24"
                          placeholder="Unit (optional)"
                          value={kr.unit ?? ''}
                          onChange={e => handleKRChange(idx, "unit", e.target.value)}
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <footer className="sticky bottom-0 bg-white border-t flex justify-end gap-4 p-4">
            <Button variant="secondary" type="button" onClick={onClose} className="cursor-pointer">Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving} className={saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}>
              {saving ? 'Saving...' : 'Save OKR'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
