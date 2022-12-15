import { useCallback, useContext, useMemo } from "react";
import { OpenDirection } from "../shared";
import { OpenDirectionType, UnderlayParams, OverlayParams } from "../types";
import { UnderlayContext, OverlayContext } from "../index";

export function useUnderlayParams<T>() {
  const underlayContext = useContext(UnderlayContext);
  if (!underlayContext) {
    throw new Error(
      "useUnderlayParams must be called from within an UnderlayContext.Provider!"
    );
  }
  return underlayContext as UnderlayParams<T>;
}

export function useOverlayParams<T>() {
  const overlayContext = useContext(OverlayContext);
  if (!overlayContext) {
    throw new Error(
      "useOverlayParams must be called from within an OverlayContext.Provider!"
    );
  }
  return overlayContext as OverlayParams<T>;
}

export function useSwipeableParams<T>() {
  const overlayContext = useContext(OverlayContext) as
    | OverlayParams<T>
    | undefined;
  if (!overlayContext) {
    throw new Error(
      "useSwipeableParams must be called from within an OverlayContext.Provider!"
    );
  }
  const underlayContext = useContext(UnderlayContext);
  const contextDirection = underlayContext?.direction;

  const open = useCallback(
    (snapPoint?: number, direction?: OpenDirectionType) => {
      const openFnNext = overlayContext.openNext;
      const openFnPrevious = overlayContext.openPrevious;
      const openDirection = direction || contextDirection;
      const openFn =
        openDirection === OpenDirection.NEXT ? openFnNext : openFnPrevious;
      return openFn(snapPoint);
    },
    [overlayContext, contextDirection]
  );

  const percentOpen = useMemo(() => {
    if (contextDirection) {
      // If we're calling from within an underlay context, return the open percentage of that underlay
      return contextDirection === OpenDirection.NEXT
        ? overlayContext.percentOpenNext
        : overlayContext.percentOpenPrevious;
    }
    // Return the open percentage of the active swipe direction
    return overlayContext.openDirection === OpenDirection.NEXT
      ? overlayContext.percentOpenNext
      : overlayContext.percentOpenPrevious;
  }, [overlayContext]);

  return {
    ...overlayContext,
    open,
    percentOpen,
  };
}
