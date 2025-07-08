import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import "@/components/ui/ModalInteraction.css";
import { Button } from "@/components/ui/button";

interface InviteUsersModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (emails: string[]) => Promise<void>;
  loading?: boolean;
}

export const InviteUsersModal: React.FC<InviteUsersModalProps> = ({ open, onClose, onInvite, loading }) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  function parseEmails(raw: string): string[] {
    return raw
      .split(/[\s,;\n]+/)
      .map(e => e.trim())
      .filter(e => e.length > 0)
      .filter((e, i, arr) => arr.indexOf(e) === i);
  }

  function validateEmails(emails: string[]): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.length > 0 && emails.every(e => emailRegex.test(e));
  }

  async function handleInvite() {
    setError(null);
    const emails = parseEmails(input);
    if (!validateEmails(emails)) {
      setError("Enter one or more valid email addresses (comma, space, semicolon, or newline separated)");
      return;
    }
    try {
      await onInvite(emails);
      setInput("");
      onClose();
    } catch {
      setError("Failed to send invites. Please try again.");
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Invite New Users">
      <div className="flex flex-col gap-4">
        <label htmlFor="invite-emails" className="font-medium text-sm">
          Enter one or more email addresses to invite:
        </label>
        <textarea
          id="invite-emails"
          className="modal-table-row w-full border border-gray-300 rounded-lg p-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y text-sm transition-shadow cursor-text focus:shadow-md hover:shadow-sm"
          placeholder="e.g. user1@example.com, user2@example.com"
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        {error && <div className="text-red-600 text-xs mt-2">{error}</div>}
        <div className="flex flex-row justify-end gap-2 mt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="modal-btn modal-cancel-btn cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          >
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            isLoading={loading}
            className="modal-btn cursor-pointer focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
          >
            Send Invites
          </Button>
        </div>
      </div>
    </Modal>
  );
};
