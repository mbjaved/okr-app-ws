"use client";
import React from "react";
import { OkrDialog } from "../../../components/okr/OkrDialog";

interface OkrDetailsEditDialogProps {
  open: boolean;
  okr: any;
  onClose: () => void;
  onSave: (okr: any) => void;
}

export const OkrDetailsEditDialog: React.FC<OkrDetailsEditDialogProps> = ({ open, okr, onClose, onSave }) => {
  if (!open || !okr) return null;
  return (
    <OkrDialog
      open={open}
      onClose={onClose}
      onSave={onSave}
      initialData={okr}
    />
  );
};
