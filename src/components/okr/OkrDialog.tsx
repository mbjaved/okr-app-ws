import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";

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

interface OkrDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (okr: OkrUpdatePayload) => void;
  initialData?: OkrUpdatePayload;
}

interface OkrUpdatePayload {
  _id?: string;
  objective?: string;
  description?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  keyResults?: KeyResult[];
}

type KeyResult = KeyResultPercent | KeyResultTarget;


interface OkrUpdatePayload {
  _id?: string;
  objective?: string;
  description?: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  keyResults?: KeyResult[];
}

export const OkrDialog: React.FC<OkrDialogProps> = ({ open, onClose, onSave, initialData }) => {
  // State
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [keyResults, setKeyResults] = useState<KeyResult[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptError, setDeptError] = useState("");

  // Sync state from initialData
  useEffect(() => {
    if (open) {
      setObjective(typeof initialData?.objective === 'string' ? initialData.objective : "");
      setDescription(typeof initialData?.description === 'string' ? initialData.description : "");
      let deptId = "";
      if (initialData?.departmentId) {
        if (typeof initialData.departmentId === "object" && initialData.departmentId !== null) {
          deptId = initialData.departmentId._id || "";
        } else if (typeof initialData.departmentId === "string") {
          deptId = initialData.departmentId;
        }
      }
      setDepartmentId(deptId);
      setStartDate(typeof initialData?.startDate === 'string' ? initialData.startDate.slice(0, 10) : "");
      setEndDate(typeof initialData?.endDate === 'string' ? initialData.endDate.slice(0, 10) : "");
      setKeyResults(Array.isArray(initialData?.keyResults) ? initialData.keyResults : []);
      setErrors({});
    }
  }, [open, initialData]);

  // Fetch departments
  useEffect(() => {
    async function fetchDepartments() {
      try {
        setDeptError("");
        const res = await fetch("/api/departments");
        if (!res.ok) throw new Error("Failed to fetch departments");
        const data = await res.json();
        setDepartments(data);
      } catch (err: any) {
        setDeptError("Could not load departments. Please try again later.");
      }
    }
    if (open) fetchDepartments();
  }, [open]);

  // Validation
  function validate() {
    const newErrors: { [key: string]: string } = {};
    if (!objective.trim()) newErrors.objective = "Objective is required";
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

  // Form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!validate()) return;
    setSaving(true);
    try {
      const okrData = {
        ...(initialData && initialData._id ? { _id: initialData._id } : {}),
        objective,
        description,
        departmentId,
        startDate,
        endDate,
        keyResults,
      };
      await onSave(okrData);
      setSaving(false);
      onClose();
    } catch (err: any) {
      setSaving(false);
      setErrors({ form: err?.message || 'Failed to save OKR. Please try again.' });
    }
  }

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
          <label className="flex flex-col gap-1">
            <span>Department</span>
            <select
              className="border rounded px-3 py-2"
              value={departmentId || ""}
              onChange={e => setDepartmentId(e.target.value)}
              style={{ color: departmentId ? '#000C2C' : '#B3BCC5' }}
            >
              <option value="">Select a department</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>{dept.name}</option>
              ))}
            </select>
            {deptError && <span className="text-red-500 text-xs mt-1">{deptError}</span>}
          </label>
          <div className="flex gap-4">
            <label className="flex-1 flex flex-col gap-1">
              <span>Start Date <span className="text-red-500">*</span></span>
              <input
                type="date"
                className={`border rounded px-3 py-2 ${errors.startDate ? 'border-red-500' : ''}`}
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
                className={`border rounded px-3 py-2 ${errors.endDate ? 'border-red-500' : ''}`}
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
              <Button type="button" variant="secondary" onClick={handleAddKR}>Add Key Result</Button>
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
                      className="border rounded px-2 py-1"
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
            <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save OKR'}
            </Button>
          </footer>
        </form>
      </div>
    </div>
  );
};
