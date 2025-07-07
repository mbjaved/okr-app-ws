// Accessible TeamFilters component for Teams page (modal/drawer)
// Reuses MultiSelect, matches OKRs page filter UX
import React from "react";
import { MultiSelect, MultiSelectOption } from "@/components/ui/MultiSelect";
import { Button } from "@/components/ui/button";

interface TeamFiltersProps {
  open: boolean;
  onClose: () => void;
  departmentOptions: MultiSelectOption[];
  roleOptions: MultiSelectOption[];
  selectedDepartments: string[];
  selectedRoles: string[];
  onDepartmentsChange: (value: string[]) => void;
  onRolesChange: (value: string[]) => void;
  onReset: () => void;
  onApply: () => void;
  activeFilterCount: number;
}

export const TeamFilters: React.FC<TeamFiltersProps> = ({
  open,
  onClose,
  departmentOptions,
  roleOptions,
  selectedDepartments,
  selectedRoles,
  onDepartmentsChange,
  onRolesChange,
  onReset,
  onApply,
  activeFilterCount,
}) => {
  React.useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
      role="dialog"
      aria-modal="true"
      onClick={e => {
        // Only close if clicking the overlay, not the modal itself
        if (e.target === e.currentTarget) onClose();
      }}
      style={{ cursor: 'pointer' }}
    >
      <div
        className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative"
        style={{ cursor: 'default' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 cursor-pointer" onClick={onClose} aria-label="Close filters">
          <span aria-hidden>×</span>
        </button>
        <h2 className="text-lg font-semibold mb-4">Filter Teams</h2>
        <div className="space-y-4">
          <MultiSelect
            label="Departments"
            options={departmentOptions}
            value={selectedDepartments}
            onChange={onDepartmentsChange}
            placeholder="Select departments"
            isMulti
            className="cursor-pointer"
          />
          <MultiSelect
            label="Roles"
            options={roleOptions}
            value={selectedRoles}
            onChange={onRolesChange}
            placeholder="Select roles"
            isMulti
            className="cursor-pointer"
          />
        </div>
        <div className="flex justify-between items-center mt-6 gap-2">
          <Button variant="outline" onClick={onReset} type="button" className="cursor-pointer">Reset</Button>
          <span className="text-xs text-gray-500">{activeFilterCount > 0 ? `${activeFilterCount} filters applied` : "No filters"}</span>
          <Button onClick={onApply} type="button" className="cursor-pointer">Apply</Button>
        </div>
      </div>
    </div>
  );
};
