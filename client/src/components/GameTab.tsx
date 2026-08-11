import { useContext } from "react";
import { GlobalStateContext } from "@/context/GlobalContext";

export const GameTab = () => {
  const { visitorStats } = useContext(GlobalStateContext);

  return (
    <div className="grid gap-3">
      <div className="card">
        <h4>Your Record</h4>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div>
            <p className="p3">Total Wins</p>
            <p className="h4">{visitorStats.totalWins}</p>
          </div>
          <div>
            <p className="p3">Games Played</p>
            <p className="h4">{visitorStats.totalGamesPlayed}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h4>How to Play</h4>
        <ol className="p2" style={{ paddingLeft: "1.25rem", listStyle: "decimal" }}>
          <li>Two players click the pink X or blue O sprite on the board to claim a symbol.</li>
          <li>Once both symbols are claimed, whoever is picked first moves first.</li>
          <li>Click cells on the board to place your mark. Get three in a row to win.</li>
          <li>Press Reset (below) when you want to start a new round.</li>
        </ol>
      </div>
    </div>
  );
};

export default GameTab;
