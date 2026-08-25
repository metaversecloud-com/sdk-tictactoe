import { Dispatch } from "react";
import { ActionType, InitialState, SET_GAME_STATE } from "@/context/types";

export const setGameState = (dispatch: Dispatch<ActionType> | null, gameState: Partial<InitialState>) => {
  if (!dispatch) return;
  dispatch({
    type: SET_GAME_STATE,
    payload: { ...gameState, error: null },
  });
};
