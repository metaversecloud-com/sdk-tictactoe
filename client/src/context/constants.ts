import { InitialState } from "./types";

export const initialState: InitialState = {
  hasInteractiveParams: false,
  hasSetupBackend: false,
  interactiveParams: {
    assetId: "",
    displayName: "",
    identityId: "",
    interactiveNonce: "",
    interactivePublicKey: "",
    profileId: "",
    sceneDropId: "",
    uniqueName: "",
    urlSlug: "",
    username: "",
    visitorId: "",
  },
  visitor: {
    isAdmin: false,
    displayName: "",
    profileId: "",
    visitorId: 0,
  },
  gameData: null,
  leaderboard: [],
  badges: {},
  visitorInventory: {},
  visitorStats: { totalWins: 0, totalGamesPlayed: 0 },
  error: null,
};
