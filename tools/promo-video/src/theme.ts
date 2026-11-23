import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * Visual tokens lifted from the product itself:
 * - packages/ui/src/lib/theme/themes/varin-light.json (primary #4b6fac, graphite, paper)
 * - packages/web/public/logo-*.svg and .github/readme/assets/wordmark.svg (#20272a / #77837f / #efefe8)
 * - theme config transitions: cubic-bezier(0.22, 1, 0.36, 1)
 */
export const color = {
  paper: "#efefe8",
  paperDeep: "#e6e6de",
  surface: "#fafafa",
  ink: "#20272a",
  text: "#383838",
  slate: "#77837f",
  muted: "#686868",
  line: "#d8d8d8",
  accent: "#4b6fac",
  accentSoft: "rgba(75, 111, 172, 0.16)",
  accentGlow: "rgba(75, 111, 172, 0.45)",
  night: "#1a1f22",
  nightRaised: "#242b2e",
  nightLine: "#343d40",
  nightText: "#eeeee8",
  nightMuted: "#8e9694",
  navy: "#141b2b",
  success: "#5f8d3d",
  successOnDark: "#8fbf6a",
  warning: "#c9a24a",
  error: "#d0695e",
} as const;

export const font = {
  sans: "Inter, 'Noto Sans SC', sans-serif",
  mono: "'Cascadia Mono', Consolas, 'Noto Sans SC', monospace",
} as const;

/** Product transition curve. */
export const productEase = [0.22, 1, 0.36, 1] as const;

loadFont({
  family: "Inter",
  url: staticFile("fonts/Inter-Variable.woff2"),
  weight: "100 900",
});

loadFont({
  family: "Noto Sans SC",
  url: staticFile("fonts/NotoSansSC-VF.ttf"),
  weight: "100 900",
});
