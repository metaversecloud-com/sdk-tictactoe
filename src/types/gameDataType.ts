export type GameDataType = {
  claimedCells?: object;
  isGameOver?: boolean;
  keyAssetId?: string;
  lastInteraction?: Date;
  lastPlayerTurn?: number;
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
};
