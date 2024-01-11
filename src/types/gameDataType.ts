export type GameDataType = {
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
  status?: object;
};
