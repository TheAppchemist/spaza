import { useWindowDimensions } from "react-native";
import { useMemo } from "react";

const TABLET_MIN_WIDTH = 768;

/**
 * Returns whether the current window is tablet-sized (width >= 768).
 * Use for responsive layouts: split view, larger touch targets, etc.
 */
export function useIsTablet() {
  const { width } = useWindowDimensions();
  return useMemo(() => width >= TABLET_MIN_WIDTH, [width]);
}

/**
 * Returns the current window width (for maxWidth or breakpoints).
 */
export function useWindowWidth() {
  const { width } = useWindowDimensions();
  return width;
}
