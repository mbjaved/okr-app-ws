"use client";
import React, { useEffect } from "react";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  open: boolean;
  onClose: () => void;
  duration?: number;
}

const toastColors = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-blue-600 text-white",
};

export const Toast: React.FC<ToastProps> = ({ message, type = "info", open, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [open, duration, onClose]);

  if (!open) return null;
  return (
    <div
      className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg transition-all animate-fade-in-up ${toastColors[type]}`}
      role="status"
      aria-live="polite"
    >
      {message}
      <button
        className="ml-4 text-white font-bold text-lg focus:outline-none"
        onClick={onClose}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default Toast;
