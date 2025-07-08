import React from "react";
import { Button } from "@/components/ui/button";

interface InviteUsersButtonProps {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export const InviteUsersButton: React.FC<InviteUsersButtonProps> = ({ onClick, className = "", disabled }) => (
  <Button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors ${className}`}
    style={{ minWidth: 160 }}
    disabled={disabled}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
    Invite New User
  </Button>
);
