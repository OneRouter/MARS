import { Platform, I18nManager } from "react-native";

export const isRTL: boolean = I18nManager.isRTL;
export const isWeb: boolean = Platform.OS === "web";
export const renderNull: () => null = () => null;
export const MAX_Z_INDEX: number = 100;

export const OpenDirection = Object.freeze({
  NEXT: Symbol("next"),
  PREVIOUS: Symbol("previous"),
  NONE: Symbol("none"),
});
