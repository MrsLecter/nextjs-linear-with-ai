"use client";

import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

type ConfirmationModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  loadingLabel?: string;
  error?: string | null;
};

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onClose,
  confirmVariant = "primary",
  loading = false,
  loadingLabel,
  error,
}: ConfirmationModalProps) {
  const handleClose = () => {
    if (loading) {
      return;
    }

    onClose();
  };

  return (
    <Modal
      open={open}
      title={title}
      description={description}
      closeDisabled={loading}
      onClose={handleClose}
      footer={
        <div className="flex items-center justify-end gap-2">
          <Button disabled={loading} variant="ghost" onClick={handleClose}>
            {cancelLabel}
          </Button>
          <Button disabled={loading} variant={confirmVariant} onClick={() => void onConfirm()}>
            {loading ? loadingLabel ?? confirmLabel : confirmLabel}
          </Button>
        </div>
      }
    >
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </Modal>
  );
}
