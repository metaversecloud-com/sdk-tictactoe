export const SET_INTERACTIVE_PARAMS = "SET_INTERACTIVE_PARAMS";
export const SET_HAS_SETUP_BACKEND = "SET_HAS_SETUP_BACKEND";
export const SET_GAME_STATE = "SET_GAME_STATE";
export const SET_ERROR = "SET_ERROR";

export type InteractiveParams = {
  assetId: string;
  displayName: string;
  identityId: string;
  interactiveNonce: string;
  interactivePublicKey: string;
  profileId: string;
  sceneDropId: string;
  uniqueName: string;
  urlSlug: string;
  username: string;
  visitorId: string;
};

export type Player = {
  visitorId: number | null;
  displayName: string | null;
  profileId: string | null;
};

export type GameData = {
  claimedCells: Record<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8, number | null>;
  isGameOver: boolean;
  isResetInProgress: boolean;
  lastInteraction: string | Date | null;
  lastPlayerTurn: number | null;
  playerX: Player;
  playerO: Player;
  resetCount: number;
  turnCount: number;
};

export type LeaderboardEntry = {
  profileId: string;
  displayName: string;
  wins: number;
};

export type Badge = {
  id?: string;
  name: string;
  icon: string;
  description?: string;
  owned: boolean;
};

export type VisitorInventory = {
  [name: string]: { id: string; name: string; icon: string };
};

export type BadgeRecord = {
  [name: string]: { id: string; name: string; icon: string; description: string };
};

export type VisitorStats = {
  totalWins: number;
  totalGamesPlayed: number;
};

export type Visitor = {
  isAdmin: boolean;
  displayName: string;
  profileId: string;
  visitorId: number;
};

export interface InitialState {
  hasInteractiveParams: boolean;
  hasSetupBackend: boolean;
  interactiveParams: InteractiveParams;
  visitor: Visitor;
  gameData: GameData | null;
  leaderboard: LeaderboardEntry[];
  badges: BadgeRecord;
  visitorInventory: VisitorInventory;
  visitorStats: VisitorStats;
  error: string | null;
}

export type ActionType = {
  type: string;
  payload: Partial<InitialState>;
};

export type ErrorType =
  | string
  | {
      message?: string;
      response?: { data?: { error?: { message?: string }; message?: string } };
    };
