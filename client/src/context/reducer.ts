import {
  ActionType,
  InitialState,
  SET_ERROR,
  SET_GAME_STATE,
  SET_HAS_SETUP_BACKEND,
  SET_INTERACTIVE_PARAMS,
} from "./types";

export const globalReducer = (state: InitialState, action: ActionType): InitialState => {
  const { type, payload } = action;
  switch (type) {
    case SET_INTERACTIVE_PARAMS:
      return {
        ...state,
        hasInteractiveParams: true,
        interactiveParams: { ...state.interactiveParams, ...(payload.interactiveParams || {}) },
      };
    case SET_HAS_SETUP_BACKEND:
      return { ...state, hasSetupBackend: true };
    case SET_GAME_STATE:
      return {
        ...state,
        visitor: payload.visitor ?? state.visitor,
        gameData: payload.gameData ?? state.gameData,
        leaderboard: payload.leaderboard ?? state.leaderboard,
        badges: payload.badges ?? state.badges,
        visitorInventory: payload.visitorInventory ?? state.visitorInventory,
        visitorStats: payload.visitorStats ?? state.visitorStats,
        error: null,
      };
    case SET_ERROR:
      return { ...state, error: payload.error ?? null };
    default:
      return state;
  }
};
