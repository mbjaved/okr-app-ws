// OkrOwners.tsx
// Best Practices: Modular, accessible, ready for multi-owner, design prompt reference
import React from "react";
import Avatar from "../ui/avatar";

interface OkrOwnersProps {
  owners: { name: string; avatarUrl?: string }[];
}

export const OkrOwners: React.FC<OkrOwnersProps> = ({ owners }) => (
  <span className="flex items-center gap-1">
    <span className="text-gray-400 mr-1">Owners:</span>
    {owners.map((owner, idx) => (
      <Avatar
        key={owner.name + idx}
        user={owner}
        size="sm"
      />
    ))}
    <span className="ml-1 font-medium text-gray-700 truncate max-w-[100px]" tabIndex={0} aria-label={`Owners: ${owners.map(o => o.name).join(', ')}`}>{owners.map(o => o.name).join(", ")}</span>
  </span>
);
