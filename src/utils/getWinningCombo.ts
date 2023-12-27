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

export const getWinningCombo = (status) => {
  if (status[0] && status[1] && status[2] && status[0] === status[1] && status[1] === status[2]) return combos.H_TOP;
  if (status[3] && status[4] && status[5] && status[3] === status[4] && status[4] === status[5]) return combos.H_MID;
  if (status[6] && status[7] && status[8] && status[6] === status[7] && status[7] === status[8]) return combos.H_BOT;
  if (status[0] && status[3] && status[6] && status[0] === status[3] && status[3] === status[6]) return combos.V_LEFT;
  if (status[1] && status[4] && status[7] && status[1] === status[4] && status[4] === status[7]) return combos.V_MID;
  if (status[2] && status[5] && status[8] && status[2] === status[5] && status[5] === status[8]) return combos.V_RIGHT;
  if (status[0] && status[4] && status[8] && status[0] === status[4] && status[4] === status[8]) return combos.R_CROSS;
  if (status[2] && status[4] && status[6] && status[2] === status[4] && status[4] === status[6]) return combos.L_CROSS;
  return null;
};
