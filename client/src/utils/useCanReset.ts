import { useContext, useMemo } from "react";
import { GlobalStateContext } from "@/context/GlobalContext";

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export const CANNOT_RESET_REASON =
  "Only current players, admins, or after 5 minutes of inactivity can reset the board.";

/**
 * Mirrors the server-side rule in `handleResetBoard` so the client can
 * disable / hide the confirm button before the visitor incurs a doomed
 * request. Returns `true` when this visitor would be allowed to reset.
 */
export const useCanReset = (): boolean => {
  const { visitor, gameData } = useContext(GlobalStateContext);

  return useMemo(() => {
    if (!gameData) return true;
    if (visitor?.isAdmin) return true;
    if (gameData.isResetInProgress) return false;
    const myVisitorId = visitor?.visitorId;
    const isPlayer =
      typeof myVisitorId === "number" &&
      (gameData.playerX?.visitorId === myVisitorId || gameData.playerO?.visitorId === myVisitorId);
    if (isPlayer) return true;
    if (gameData.isGameOver) return true;
    if (!gameData.lastInteraction) return true;
    const last = new Date(gameData.lastInteraction).getTime();
    if (Number.isNaN(last)) return true;
    return Date.now() - last > FIVE_MINUTES_MS;
  }, [gameData, visitor]);
};
