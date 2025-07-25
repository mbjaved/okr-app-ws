import React from "react";

interface ModalProps {
  open: boolean;
  title?: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ open, title, children, onClose, actions }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      style={{ cursor: 'pointer' }}
      aria-modal="true"
      role="dialog"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-lg shadow-lg max-w-sm w-full p-6 relative"
        style={{ cursor: 'default' }}
        onClick={e => e.stopPropagation()}
      >
        {title && <h2 className="text-lg font-semibold mb-4">{title}</h2>}
        <div className="mb-4">{children}</div>
        <div className="flex justify-end gap-2">{actions}</div>
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-xl cursor-pointer hover:bg-gray-100 rounded transition-colors"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </div>
    </div>
  );
};
