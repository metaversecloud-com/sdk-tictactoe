export const combos = {
  H_TOP: [0, 1, 2],
  H_MID: [3, 4, 5],
  H_BOT: [6, 7, 8],
  V_LEFT: [0, 3, 6],
  V_MID: [1, 4, 7],
  V_RIGHT: [2, 5, 8],
  L_CROSS: [2, 4, 6],
  R_CROSS: [0, 4, 8],
};

export const getGameStatus = (claimedCells) => {
  if (
    claimedCells[0] &&
    claimedCells[1] &&
    claimedCells[2] &&
    claimedCells[0] === claimedCells[1] &&
    claimedCells[1] === claimedCells[2]
  )
    return { hasWinningCombo: true, winningCombo: combos.H_TOP };
  if (
    claimedCells[3] &&
    claimedCells[4] &&
    claimedCells[5] &&
    claimedCells[3] === claimedCells[4] &&
    claimedCells[4] === claimedCells[5]
  )
    return { hasWinningCombo: true, winningCombo: combos.H_MID };
  if (
    claimedCells[6] &&
    claimedCells[7] &&
    claimedCells[8] &&
    claimedCells[6] === claimedCells[7] &&
    claimedCells[7] === claimedCells[8]
  )
    return { hasWinningCombo: true, winningCombo: combos.H_BOT };
  if (
    claimedCells[0] &&
    claimedCells[3] &&
    claimedCells[6] &&
    claimedCells[0] === claimedCells[3] &&
    claimedCells[3] === claimedCells[6]
  )
    return { hasWinningCombo: true, winningCombo: combos.V_LEFT };
  if (
    claimedCells[1] &&
    claimedCells[4] &&
    claimedCells[7] &&
    claimedCells[1] === claimedCells[4] &&
    claimedCells[4] === claimedCells[7]
  )
    return { hasWinningCombo: true, winningCombo: combos.V_MID };
  if (
    claimedCells[2] &&
    claimedCells[5] &&
    claimedCells[8] &&
    claimedCells[2] === claimedCells[5] &&
    claimedCells[5] === claimedCells[8]
  )
    return { hasWinningCombo: true, winningCombo: combos.V_RIGHT };
  if (
    claimedCells[0] &&
    claimedCells[4] &&
    claimedCells[8] &&
    claimedCells[0] === claimedCells[4] &&
    claimedCells[4] === claimedCells[8]
  )
    return { hasWinningCombo: true, winningCombo: combos.R_CROSS };
  if (
    claimedCells[2] &&
    claimedCells[4] &&
    claimedCells[6] &&
    claimedCells[2] === claimedCells[4] &&
    claimedCells[4] === claimedCells[6]
  )
    return { hasWinningCombo: true, winningCombo: combos.L_CROSS };
  if (
    claimedCells[0] &&
    claimedCells[1] &&
    claimedCells[2] &&
    claimedCells[3] &&
    claimedCells[4] &&
    claimedCells[5] &&
    claimedCells[6] &&
    claimedCells[7] &&
    claimedCells[8]
  )
    return { hasWinningCombo: false, isDraw: true };
  return { hasWinningCombo: false, isDraw: false };
};
