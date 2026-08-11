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
    displayName?: string;
    visitorId?: number;
  };
  playerX?: {
    profileId?: string;
    displayName?: string;
    visitorId?: number;
  };
  resetCount?: number;
  turnCount?: number;
};
