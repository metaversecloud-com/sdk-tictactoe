import { Dispatch } from "react";
import { ActionType, ErrorType, SET_ERROR } from "@/context/types";

export const setErrorMessage = (dispatch: Dispatch<ActionType> | null, error: ErrorType) => {
  console.error(error);
  if (!dispatch) return;

  let message: any = error;
  if (typeof error !== "string") {
    message = error.response?.data?.error?.message || error.response?.data?.message || error.message || error;
  }

  dispatch({
    type: SET_ERROR,
    payload: { error: error === "" ? null : `Error: ${JSON.stringify(message)}` },
  });
};
