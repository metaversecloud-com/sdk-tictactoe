export type GameDataType = {
  claimedCells?: object;
  isGameOver?: boolean;
  isResetInProgress?: boolean;
  keyAssetId?: string;
  lastInteraction?: Date;
  lastPlayerTurn?: number;
  playerCount?: number;
  playerO?: {
    profileId?: string;
    username?: string;
    visitorId?: number;
  };
  playerX?: {
    profileId?: string;
    username?: string;
    visitorId?: number;
  };
  resetCount?: number;
  turnCount?: number;
};
