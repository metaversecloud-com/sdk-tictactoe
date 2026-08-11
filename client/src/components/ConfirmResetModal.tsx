import { useState } from "react";

interface ConfirmResetModalProps {
  onConfirm: () => Promise<void> | void;
  onCancel: () => Promise<void> | void;
  // When false, the modal displays an explanation of why this visitor cannot
  // reset and hides the confirm button — the only way out is to dismiss.
  canReset?: boolean;
  cannotResetReason?: string;
}

const DEFAULT_CANNOT_RESET_REASON =
  "Only current players, admins, or after 5 minutes of inactivity can reset the board.";

export const ConfirmResetModal = ({
  onConfirm,
  onCancel,
  canReset = true,
  cannotResetReason,
}: ConfirmResetModalProps) => {
  const [disabled, setDisabled] = useState(false);

  const title = canReset ? "Reset the board?" : "Can't reset the board";
  const message = canReset
    ? "Are you sure you want to reset the board? Your progress will be cleared."
    : cannotResetReason || DEFAULT_CANNOT_RESET_REASON;
  const dismissLabel = canReset ? "No, Stay Here" : "OK";

  return (
    <div className="modal-container" role="dialog" aria-modal="true" aria-labelledby="confirm-reset-title">
      <div className="modal">
        <h4 id="confirm-reset-title">{title}</h4>
        <p>{message}</p>
        <div className="actions">
          <button
            className="btn btn-outline"
            disabled={disabled}
            onClick={async () => {
              setDisabled(true);
              try {
                await onCancel();
              } finally {
                setDisabled(false);
              }
            }}
          >
            {dismissLabel}
          </button>
          {canReset && (
            <button
              className="btn btn-danger-outline"
              disabled={disabled}
              onClick={async () => {
                setDisabled(true);
                try {
                  await onConfirm();
                } finally {
                  setDisabled(false);
                }
              }}
            >
              Yes, Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmResetModal;
