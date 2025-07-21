import React from "react";
import { Modal } from "./Modal";
import { Button } from "./button";
import "./ModalInteraction.css";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmText?: string;
  confirmPlaceholder?: string;
  confirmButtonLabel?: string;
  confirmButtonClass?: string;
  onConfirm: () => void;
  onCancel: () => void;
  warning?: boolean; // If true, show warning (yellow) styles and icon
  icon?: React.ReactNode; // Optional icon to display in header
  children?: React.ReactNode; // Optional custom children for advanced use
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmText = '',
  confirmPlaceholder = '',
  confirmButtonLabel = 'Confirm',
  confirmButtonClass = 'bg-red-600 hover:bg-red-700 text-white',
  onConfirm,
  onCancel,
  warning = false,
  icon,
  children,
}) => {
  const [input, setInput] = React.useState('');
  React.useEffect(() => { if (open) setInput(''); }, [open]);
  // If confirmText is set, require exact match. If not, always enable confirm button (for soft delete etc).
  const canConfirm = (typeof confirmText === 'string' && confirmText.length > 0) ? (input.length > 0 && input === confirmText) : true;
  return (
    <Modal
      open={open}
      title={undefined}
      onClose={onCancel}
      actions={[
        <Button
          variant="secondary"
          className="modal-btn modal-cancel-btn"
          onClick={onCancel}
        >
          Cancel
        </Button>,
        <Button
          variant="primary"
          className={`modal-btn ${confirmButtonClass} ${canConfirm ? '' : 'opacity-50 cursor-not-allowed'}`}
          onClick={onConfirm}
          disabled={!canConfirm}
          title={confirmButtonLabel}
        >
          {confirmButtonLabel}
        </Button>
      ]}
    >
      {warning ? (
        <div className="flex items-center gap-3 mb-1">
          {icon || (
            <svg className="w-8 h-8 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10" fill="#FEF3C7" />
              <path d="M12 8v4" stroke="#F59E42" strokeWidth="2" strokeLinecap="round" />
              <circle cx="12" cy="16" r="1" fill="#F59E42" />
            </svg>
          )}
          <h2 className="text-lg font-bold text-yellow-900">{title}</h2>
        </div>
      ) : (
        <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
      )}
      <div className={warning ? "text-yellow-900 bg-yellow-50 rounded px-3 py-2 border border-yellow-200 mb-2" : "mb-2"}>
        {message}
      </div>
      {children}
      {confirmText && (
        <div className="flex flex-col gap-2 w-full">
          <label htmlFor="confirm-modal-input" className="text-sm text-gray-700">
            Please type <span className="font-semibold">{confirmText}</span> to confirm:
          </label>
          <input
            id="confirm-modal-input"
            type="text"
            className={warning ? "modal-table-row border border-yellow-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-yellow-400" : "modal-table-row w-full border rounded px-2 py-1 mt-2"}
            placeholder={confirmPlaceholder || confirmText}
            value={input}
            onChange={e => setInput(e.target.value)}
            aria-label={`Type ${confirmText} to confirm`}
            autoFocus
          />
        </div>
      )}
    </Modal>
  );
};
