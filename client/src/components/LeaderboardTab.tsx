import { useContext, useState } from "react";
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { backendAPI, setErrorMessage, setGameState } from "@/utils";
import { ErrorType } from "@/context/types";

export const LeaderboardTab = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { leaderboard, visitor } = useContext(GlobalStateContext);
  const [isBusy, setIsBusy] = useState(false);

  const handleResetLeaderboard = async () => {
    if (!confirm("Reset this leaderboard? This cannot be undone.")) return;
    setIsBusy(true);
    try {
      await backendAPI.post("/leaderboard/reset");
      const refreshed = await backendAPI.get("/leaderboard");
      setGameState(dispatch, { leaderboard: refreshed.data?.leaderboard || [] });
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="grid gap-3">
      <h3 className="h3">Top 25</h3>
      {leaderboard.length === 0 ? (
        <p className="p2">No wins yet. Be the first!</p>
      ) : (
        <table className="table leaderboard-table">
          <thead>
            <tr>
              <th className="h5">#</th>
              <th className="h5 w-full">Player</th>
              <th className="h5">Wins</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((entry, idx) => (
              <tr key={entry.profileId} className={entry.profileId === visitor.profileId ? "highlight" : ""}>
                <td className="p2">{idx + 1}</td>
                <td className="p2">{entry.displayName || "Anonymous"}</td>
                <td className="p2 wins">{entry.wins}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {visitor.isAdmin && (
        <div className="mt-4">
          <button className="btn btn-danger-outline" onClick={handleResetLeaderboard} disabled={isBusy}>
            Reset Leaderboard
          </button>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTab;
