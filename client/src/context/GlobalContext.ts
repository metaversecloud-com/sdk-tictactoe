import { createContext, Dispatch } from "react";
import { ActionType, InitialState } from "./types";
import { initialState } from "./constants";

export const GlobalStateContext = createContext<InitialState>(initialState);
export const GlobalDispatchContext = createContext<Dispatch<ActionType> | null>(null);
