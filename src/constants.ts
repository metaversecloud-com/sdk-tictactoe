export const cellWidth = 80;

export const defaultGameData = {
  claimedCells: {
    0: null,
    1: null,
    2: null,
    3: null,
    4: null,
    5: null,
    6: null,
    7: null,
    8: null,
  },
  isGameOver: false,
  isResetInProgress: false,
  lastInteraction: null,
  lastPlayerTurn: null,
  playerCount: 0,
  playerO: { profileId: null, username: null, visitorId: null },
  playerX: { profileId: null, username: null, visitorId: null },
  resetCount: 0,
  turnCount: 0,
};

export const defaultGameText = "Click X or O to begin!";
