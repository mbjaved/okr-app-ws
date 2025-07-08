// AssignRoleModal.tsx
// Accessible modal for assigning/changing a user's role
import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import "../ui/ModalInteraction.css";
import { Button } from "@/components/ui/button";

interface AssignRoleModalProps {
  open: boolean;
  user: { _id: string; username?: string; email?: string; role?: string } | null;
  roleOptions: { value: string; label: string }[];
  onClose: () => void;
  onAssign: (userId: string, role: string) => Promise<void>;
  loading?: boolean;
}

export const AssignRoleModal: React.FC<AssignRoleModalProps> = ({
  open,
  user,
  roleOptions,
  onClose,
  onAssign,
  loading = false,
}) => {
  const [selectedRole, setSelectedRole] = useState(user?.role || "");
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    setSelectedRole(user?.role || "");
    setError(null);
  }, [user, open]);

  const handleAssign = async () => {
    if (!user || !selectedRole) {
      setError("Please select a role.");
      return;
    }
    await onAssign(user._id, selectedRole);
  };

  return (
    <Modal open={open} onClose={onClose} title={`Assign/Change Role for ${user?.username || user?.email || "User"}`}> 
      <div className="flex flex-col gap-4">
        <label htmlFor="role-select" className="font-semibold">Role</label>
        <select
          id="role-select"
          className="modal-table-row w-full border rounded px-3 py-2 mt-2"
          value={selectedRole}
          onChange={e => setSelectedRole(e.target.value)}
          disabled={loading}
        >
          <option value="">Select a role</option>
          {roleOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <div className="flex gap-2 justify-end mt-4">
          <Button variant="secondary" className="modal-btn modal-cancel-btn" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button className="modal-btn" onClick={handleAssign} isLoading={loading} disabled={!selectedRole || loading}>
            Assign Role
          </Button>
        </div>
      </div>
    </Modal>
  );
};
