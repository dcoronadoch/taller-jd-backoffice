import { useEffect } from "react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmar",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onCancel();
    };

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div className="modal-overlay" onMouseDown={() => !busy && onCancel()}>
      <div
        className="modal modal-small"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h3 id="confirm-title">{title}</h3>
        </div>

        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="modal-foot">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
