import { useContext, useState } from "react";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { backendAPI, setErrorMessage, setGameState } from "@/utils";
import { ErrorType } from "@/context/types";

export const AdminView = ({ onBack }: { onBack: () => void }) => {
  const dispatch = useContext(GlobalDispatchContext);
  const { visitor } = useContext(GlobalStateContext);
  const [busy, setBusy] = useState(false);

  const handleResetLeaderboard = async () => {
    if (!confirm("Reset the leaderboard? This cannot be undone.")) return;
    setBusy(true);
    try {
      const res = await backendAPI.post("/leaderboard/reset");
      setGameState(dispatch, { leaderboard: res.data?.leaderboard || [] });
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
    } finally {
      setBusy(false);
    }
  };

  const handleForceReset = async () => {
    if (!confirm("Force-reset the board? Any in-progress game will be cleared.")) return;
    setBusy(true);
    try {
      await backendAPI.post("/reset");
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
    } finally {
      setBusy(false);
    }
  };

  if (!visitor.isAdmin) {
    return (
      <div>
        <button className="btn btn-icon" onClick={onBack} aria-label="Back">
          <img src="https://sdk-style.s3.amazonaws.com/icons/arrow.svg" alt="" />
        </button>
        <p className="p2 mt-4">You need admin access to view this panel.</p>
      </div>
    );
  }

  return (
    <div>
      <button className="btn btn-icon icon-with-rounded-border mb-4" onClick={onBack} aria-label="Back to drawer">
        <img src="https://sdk-style.s3.amazonaws.com/icons/arrow.svg" alt="" />
      </button>

      <h2 className="h2">Admin</h2>
      <p className="p2 mb-4">Admin-only controls for this Tic-Tac-Toe board.</p>

      <div className="grid gap-3">
        <div className="card">
          <h4>Board Controls</h4>
          <p className="p3 mb-2">
            Force a reset of the current game state. Same as pressing the Reset button on the game tab, but always
            allowed for admins.
          </p>
          <button className="btn btn-danger-outline" onClick={handleForceReset} disabled={busy}>
            Force Reset Board
          </button>
        </div>

        <div className="card">
          <h4>Leaderboard</h4>
          <p className="p3 mb-2">Wipe the leaderboard for this board instance.</p>
          <button className="btn btn-danger-outline" onClick={handleResetLeaderboard} disabled={busy}>
            Reset Leaderboard
          </button>
        </div>

        <div className="card">
          <h4>Extending this panel</h4>
          <p className="p3">
            Add more admin controls here (e.g. rotating cell art, cycling win-line colors, spawning power-ups) — see the
            README for the extension pattern.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
