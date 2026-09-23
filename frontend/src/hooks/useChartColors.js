import { useMemo } from "react";
import { useTheme } from "../store/theme";

// daisyUI stores each theme's tokens as full CSS oklch(...) values on
// :root's custom properties, so reading them straight from computed style
// gives an SVG-ready color string and automatically follows whichever
// theme is active — no hardcoded hex that'd go stale (or clash) the moment
// someone switches themes. Recomputed whenever the theme toggles.
const VARS = [
  "--color-primary",
  "--color-secondary",
  "--color-accent",
  "--color-success",
  "--color-warning",
  "--color-info",
  "--color-error",
  "--color-base-content",
  "--color-base-300",
];

export function useChartColors() {
  const theme = useTheme((s) => s.theme);

  return useMemo(() => {
    const styles = getComputedStyle(document.documentElement);
    const colors = {};
    for (const name of VARS) {
      colors[name.replace("--color-", "")] = styles.getPropertyValue(name).trim();
    }
    return colors;
    // theme is read only to force a recompute when it changes — the actual
    // values come from the DOM, not from this variable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);
}
