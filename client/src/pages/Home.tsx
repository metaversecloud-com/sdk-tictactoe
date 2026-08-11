import { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

// components
import {
  AdminIconButton,
  AdminView,
  BadgesTab,
  ConfirmResetModal,
  GameTab,
  LeaderboardTab,
  PageContainer,
} from "@/components";

// context
import { GlobalDispatchContext, GlobalStateContext } from "@/context/GlobalContext";
import { ErrorType } from "@/context/types";

// utils
import { backendAPI, setErrorMessage, setGameState } from "@/utils";

type Tab = "game" | "leaderboard" | "badges";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const Home = () => {
  const dispatch = useContext(GlobalDispatchContext);
  const { hasSetupBackend, visitor, gameData } = useContext(GlobalStateContext);

  const [searchParams] = useSearchParams();
  const openWithReset = searchParams.get("reset") === "true";

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("game");
  const [showAdmin, setShowAdmin] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(openWithReset);
  const [resetTriggeredByQuery, setResetTriggeredByQuery] = useState(openWithReset);

  const fetchGameState = useMemo(
    () => async () => {
      try {
        const res = await backendAPI.get("/game-state");
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

  const handleResetConfirm = async () => {
    try {
      await backendAPI.post("/reset");
      await fetchGameState();
    } catch (error) {
      setErrorMessage(dispatch, error as ErrorType);
    } finally {
      setShowConfirmReset(false);
      setResetTriggeredByQuery(false);
    }
  };

  const handleResetCancel = async () => {
    setShowConfirmReset(false);
    // If the modal was auto-opened via ?reset=true, the visitor came here from
    // clicking a canvas Reset asset — closing the iframe returns them to the
    // world rather than dumping them on the Game tab.
    if (resetTriggeredByQuery) {
      setResetTriggeredByQuery(false);
      try {
        await backendAPI.post("/close-iframe");
      } catch (error) {
        setErrorMessage(dispatch, error as ErrorType);
      }
    }
  };

  // Mirror the server's reset-eligibility rule in handleResetBoard so the
  // button reflects reality — anyone who'd be refused server-side gets a
  // disabled button instead of an error toast.
  const canReset = useMemo(() => {
    if (!gameData) return true; // Fresh board with no state — reset is a safe no-op.
    if (gameData.isResetInProgress) return false; // Someone else is resetting right now.
    if (visitor?.isAdmin) return true;
    const myVisitorId = visitor?.visitorId;
    const isPlayer =
      typeof myVisitorId === "number" &&
      (gameData.playerX?.visitorId === myVisitorId || gameData.playerO?.visitorId === myVisitorId);
    if (isPlayer) return true;
    if (gameData.isGameOver) return true;
    if (!gameData.lastInteraction) return true; // No one has played — nothing to disturb.
    const last = new Date(gameData.lastInteraction).getTime();
    if (Number.isNaN(last)) return true;
    return Date.now() - last > FIVE_MINUTES_MS;
  }, [gameData, visitor]);

  return (
    <PageContainer
      isLoading={isLoading}
      headerText="Tic-Tac-Toe"
      headerRight={<AdminIconButton onClick={() => setShowAdmin((v) => !v)} isAdminView={showAdmin} />}
    >
      {showAdmin ? (
        <AdminView onBack={() => setShowAdmin(false)} />
      ) : (
        <>
          <div className="tab-container mb-3">
            <button className={activeTab === "game" ? "btn" : "btn btn-text"} onClick={() => setActiveTab("game")}>
              Game
            </button>
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

          <div className="pb-20">
            {activeTab === "game" && <GameTab />}
            {activeTab === "leaderboard" && <LeaderboardTab />}
            {activeTab === "badges" && <BadgesTab />}
          </div>

          <div className="fixed bottom-0 inset-x-4 flex justify-center items-center bg-white py-3 border-t border-gray-200">
            <button
              className="btn btn-danger"
              onClick={() => setShowConfirmReset(true)}
              disabled={!canReset}
              title={
                canReset
                  ? undefined
                  : "Only current players, admins, or after 5 minutes of inactivity can reset the board"
              }
            >
              Reset Board
            </button>
          </div>
        </>
      )}

      {showConfirmReset && (
        <ConfirmResetModal canReset={canReset} onConfirm={handleResetConfirm} onCancel={handleResetCancel} />
      )}
    </PageContainer>
  );
};

export default Home;
