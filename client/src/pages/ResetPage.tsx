import { useContext, useEffect, useMemo, useState } from "react";

// components
import { PageContainer } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, CANNOT_RESET_REASON, setErrorMessage, setGameState, useCanReset } from "@/utils";

/**
 * Full-page Reset confirmation. Entered from the canvas Reset asset
 * (uniqueName TicTacToe_reset).
 * Cancel + not-eligible dismiss both close the iframe — the visitor came
 * here specifically to reset; if they change their mind or can't, drop
 * them back into the world instead of stranding them here.
 */
export const ResetPage = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasSetupBackend } = useContext(GlobalStateContext);
  const canReset = useCanReset();

  const [isLoading, setIsLoading] = useState(true);
  const [disabled, setDisabled] = useState(false);

  const fetchGameState = useMemo(
    () => async () => {
      try {
        const res = await backendAPI.get("/reset-state");
        setGameState(dispatch, res.data);
      } catch (error) {
        setErrorMessage(dispatch, error as ErrorType);
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch],
  );

  useEffect(() => {
    if (hasSetupBackend) fetchGameState();
  }, [hasSetupBackend, fetchGameState]);

  const closeIframe = async () => {
    try {
      await backendAPI.post("/close-iframe");
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
    }
  };

  const handleConfirm = async () => {
    setDisabled(true);
    try {
      await backendAPI.post("/reset");
      await closeIframe();
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
    } finally {
      setDisabled(false);
    }
  };

  const handleCancel = async () => {
    setDisabled(true);
    try {
      await closeIframe();
    } finally {
      setDisabled(false);
    }
  };

  const title = canReset ? "Reset the board?" : "Can't reset the board";
  const message = canReset
    ? "Are you sure you want to reset the board? Your progress will be cleared."
    : CANNOT_RESET_REASON;
  const dismissLabel = canReset ? "No, Stay Here" : "OK";

  return (
    <PageContainer isLoading={isLoading} headerText={title}>
      <p className="mt-2">{message}</p>
      <div className="actions mt-4 grid grid-cols-2 gap-2">
        <button className="btn btn-outline" disabled={disabled} onClick={handleCancel}>
          {dismissLabel}
        </button>
        {canReset && (
          <button className="btn btn-danger" disabled={disabled} onClick={handleConfirm}>
            Yes, Reset
          </button>
        )}
      </div>
    </PageContainer>
  );
};

export default ResetPage;
