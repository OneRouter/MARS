import { ReactNode } from "react";
import { DerivedValue, WithSpringConfig } from "react-native-reanimated";
import { OpenDirection } from "./shared";

export type OpenDirectionType =
  typeof OpenDirection[keyof typeof OpenDirection];

export type OpenCloseOptions = { animated?: boolean };
export type OpenPromiseFn = (
  snapPoint?: number,
  options?: OpenCloseOptions
) => Promise<void>;
export type ClosePromiseFn = (options?: OpenCloseOptions) => Promise<void>;

export type UnderlayParams<T> = {
  item: T;
  open: OpenPromiseFn;
  close: ClosePromiseFn;
  percentOpen: DerivedValue<number>;
  isGestureActive: DerivedValue<boolean>;
  direction: OpenDirectionType;
};

export type OverlayParams<T> = {
  item: T;
  openNext: OpenPromiseFn;
  openPrevious: OpenPromiseFn;
  close: ClosePromiseFn;
  openDirection: OpenDirectionType;
  percentOpenNext: DerivedValue<number>;
  percentOpenPrevious: DerivedValue<number>;
};

export type RenderUnderlay<T> = (params: UnderlayParams<T>) => ReactNode;
export type RenderOverlay<T> = (params: OverlayParams<T>) => ReactNode;

export type SwipeableProps<T> = {
  item: T;
  vertical?: boolean;
  children?: React.ReactNode;
  renderOverlay?: RenderOverlay<T>;
  renderUnderlayNext?: RenderUnderlay<T>;
  renderUnderlayPrevious?: RenderUnderlay<T>;
  onChange?: (params: {
    openDirection: OpenDirectionType;
    snapPoint: number;
  }) => void;
  overSwipe?: number;
  animationConfig?: Partial<WithSpringConfig>;
  activationThreshold?: number;
  swipeEnabled?: boolean;
  snapPointsNext?: number[];
  snapPointsPrevious?: number[];
  swipeDamping?: number;
};

export type SwipeableImperativeRef = {
  open: (
    openDirection: OpenDirectionType,
    snapPoint?: number,
    options?: OpenCloseOptions
  ) => Promise<void>;
  close: ClosePromiseFn;
};
