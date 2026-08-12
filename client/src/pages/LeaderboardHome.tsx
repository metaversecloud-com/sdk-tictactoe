import { useContext, useEffect, useMemo, useState } from "react";

// components
import { BadgesTab, LeaderboardTab, PageContainer } from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

type Tab = "leaderboard" | "badges";

/**
 * Two-tab drawer: Leaderboard | Badges. Entered from the canvas Leaderboard
 * asset (link `/leaderboard`).
 */
export const LeaderboardHome = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasSetupBackend } = useContext(GlobalStateContext);

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("leaderboard");

  const fetchGameState = useMemo(
    () => async () => {
      try {
        const res = await backendAPI.get("/leaderboard-state");
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

  return (
    <PageContainer isLoading={isLoading} headerText="Tic-Tac-Toe">
      <div className="tab-container mb-3">
        <button
          className={activeTab === "leaderboard" ? "btn" : "btn btn-text"}
          onClick={() => setActiveTab("leaderboard")}
        >
          Leaderboard
        </button>
        <button className={activeTab === "badges" ? "btn" : "btn btn-text"} onClick={() => setActiveTab("badges")}>
          Badges
        </button>
      </div>

      {activeTab === "leaderboard" && <LeaderboardTab />}
      {activeTab === "badges" && <BadgesTab />}
    </PageContainer>
  );
};

export default LeaderboardHome;
