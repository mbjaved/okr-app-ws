import * as React from "react";

interface ActionsMenuProps {
  onAssignRole: () => void;
  onActivateDeactivate: () => void;
  onResetPassword: () => void;
  isActive: boolean;
  isAdmin: boolean;
}

export const ActionsMenu: React.FC<ActionsMenuProps> = ({
  onAssignRole,
  onActivateDeactivate,
  onResetPassword,
  isActive,
  isAdmin
}) => {
  if (!isAdmin) return null;
  return (
    <div className="relative inline-block text-left group">
      <button
        type="button"
        className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
        aria-haspopup="true"
        aria-label="Open actions menu"
        tabIndex={0}
        onClick={e => {
          const menu = e.currentTarget.nextElementSibling as HTMLElement;
          if (menu) menu.classList.toggle('hidden');
        }}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      </button>
      <div className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg border border-gray-200 focus:outline-none hidden group-focus-within:block group-hover:block">
        <button
          onClick={onAssignRole}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
        >
          Assign/Change Role
        </button>
        <button
          onClick={onActivateDeactivate}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
        >
          {isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          onClick={onResetPassword}
          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 focus:bg-blue-100 focus:outline-none"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
};
