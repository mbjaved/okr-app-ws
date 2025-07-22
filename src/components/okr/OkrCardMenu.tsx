// OkrCardMenu.tsx
// Best Practices: Modular, accessible, themed menu for OKR card actions
import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { DotsHorizontalIcon, Pencil2Icon, CopyIcon, ArchiveIcon, TrashIcon, ReloadIcon } from "@radix-ui/react-icons";

interface OkrCardMenuProps {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onRestore?: () => void;
  onHardDelete?: () => void;
  status: "active" | "archived" | "deleted";
}

export const OkrCardMenu: React.FC<OkrCardMenuProps> = ({
  onEdit,
  onDuplicate,
  onArchive,
  onDelete,
  onRestore,
  onHardDelete,
  status,
}) => {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="p-1 rounded-full hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 cursor-pointer"
          aria-label="Open actions menu"
        >
          <DotsHorizontalIcon className="w-5 h-5 text-gray-400" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content
        align="end"
        sideOffset={8}
        className="min-w-[160px] rounded-xl shadow-lg bg-white border border-gray-100 py-2 z-50 animate-fadeIn"
      >
        {status !== "archived" && status !== "deleted" && (
          <DropdownMenu.Item
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            onSelect={onEdit}
          >
            <Pencil2Icon className="w-4 h-4" /> Edit
          </DropdownMenu.Item>
        )}
        {status !== "archived" && status !== "deleted" && (
          <DropdownMenu.Item
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            onSelect={onDuplicate}
          >
            <CopyIcon className="w-4 h-4" /> Duplicate
          </DropdownMenu.Item>
        )}
        {status !== "archived" && status !== "deleted" && (
          <DropdownMenu.Item
            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
            onSelect={onArchive}
          >
            <ArchiveIcon className="w-4 h-4" /> Archive
          </DropdownMenu.Item>
        )}
        {status === "archived" && (
          <>
            <DropdownMenu.Item
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              onSelect={onRestore}
            >
              <ReloadIcon className="w-4 h-4" /> Unarchive
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              onSelect={onDelete}
            >
              <TrashIcon className="w-4 h-4 text-red-500" /> Delete (Soft)
            </DropdownMenu.Item>
          </>
        )}
        {status === "deleted" && (
          <>
            <DropdownMenu.Item
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
              onSelect={onRestore}
            >
              <ReloadIcon className="w-4 h-4" /> Restore
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
              onSelect={onHardDelete}
            >
              <TrashIcon className="w-4 h-4 text-red-500" /> Delete Permanently
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
};
