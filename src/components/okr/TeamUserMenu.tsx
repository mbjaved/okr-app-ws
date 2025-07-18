// TeamUserMenu.tsx
// Custom three-dot menu for Teams table admin actions. Accessible, themed, context-appropriate.
import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DotsHorizontalIcon, PersonIcon, LockClosedIcon, UpdateIcon } from "@radix-ui/react-icons";

interface TeamUserMenuProps {
  onAssignRole: () => void;
  onActivateDeactivate: () => void;
  onResetPassword: () => void;
  isActive: boolean;
  isAdmin: boolean;
  isSelf: boolean;
}

export const TeamUserMenu: React.FC<TeamUserMenuProps> = ({
  onAssignRole,
  onActivateDeactivate,
  onResetPassword,
  isActive,
  isAdmin,
  isSelf,
}) => {
  if (!isAdmin) return null;
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
          aria-label="Open user actions menu"
        >
          <DotsHorizontalIcon className="w-5 h-5 text-gray-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        sideOffset={8}
        className="min-w-[180px] rounded-xl shadow-lg bg-white border border-gray-100 py-2 z-50 animate-fadeIn"
      >
        <DropdownMenu.Item
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          onSelect={onAssignRole}
        >
          <PersonIcon className="w-4 h-4" /> Assign Role
        </DropdownMenu.Item>
        {/* Only show Activate/Deactivate for non-self users */}
        {!isSelf && (
          <DropdownMenu.Item
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            onSelect={onActivateDeactivate}
          >
            <UpdateIcon className="w-4 h-4" /> {isActive ? "Deactivate" : "Activate"}
          </DropdownMenu.Item>
        )}
        <DropdownMenu.Item
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
          onSelect={onResetPassword}
        >
          <LockClosedIcon className="w-4 h-4" /> Reset Password
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
