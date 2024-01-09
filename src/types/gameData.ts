export type GameDataType = {
  finishLineId?: string;
  lastTurn?: number;
  messageTextId?: string;
  moves?: object;
  playerO?: {
    visitorId?: number;
  };
  playerX?: {
    visitorId?: number;
  };
  resetCount?: number;
  status?: object;
};
