import { Dispatch, PropsWithChildren } from "react";
import { GlobalDispatchContext, GlobalStateContext } from "./GlobalContext";
import { ActionType, InitialState } from "./types";

const GlobalState = ({
  initialState,
  dispatch,
  children,
}: PropsWithChildren<{ initialState: InitialState; dispatch: Dispatch<ActionType> }>) => (
  <GlobalStateContext.Provider value={initialState}>
    <GlobalDispatchContext.Provider value={dispatch}>{children}</GlobalDispatchContext.Provider>
  </GlobalStateContext.Provider>
);

export default GlobalState;
