import { createContext } from "react";
import { UnderlayParams, OverlayParams } from "../types";

export const UnderlayContext = createContext<
  UnderlayParams<unknown> | undefined
>(undefined);
export const OverlayContext = createContext<OverlayParams<unknown> | undefined>(
  undefined
);
