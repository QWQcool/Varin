import React from "react";
import { Img, staticFile } from "remotion";
import { color } from "../theme";
import type { Placement } from "../film/camera";

/** Real captures are 2220×1410 (1110×705 CSS at DPR 2). */
export const CAPTURE = { w: 2220, h: 1410 } as const;

type Layer = { readonly src: string; readonly opacity?: number };

type Props = {
  readonly at: Placement;
  readonly layers: readonly Layer[];
  readonly opacity?: number;
  readonly radius?: number;
  /** Overlays drawn in capture pixels, so they stay pinned to the UI at any zoom. */
  readonly children?: React.ReactNode;
  readonly style?: React.CSSProperties;
};

/**
 * A real product capture placed in the camera's world. Several layers of the same window
 * cross-fade to show state changes without moving a pixel.
 */
export const Screen: React.FC<Props> = ({ at, layers, opacity = 1, radius = 22, children, style }) => (
  <div
    style={{
      position: "absolute",
      left: at.x,
      top: at.y,
      width: CAPTURE.w,
      height: CAPTURE.h,
      transformOrigin: "0 0",
      scale: at.k,
      borderRadius: radius / at.k,
      overflow: "hidden",
      background: color.surface,
      outline: `${1 / at.k}px solid ${color.line}`,
      boxShadow: `0 ${50 / at.k}px ${110 / at.k}px rgba(32,39,42,0.18), 0 ${8 / at.k}px ${24 / at.k}px rgba(32,39,42,0.08)`,
      opacity,
      ...style,
    }}
  >
    {layers.map((l) =>
      (l.opacity ?? 1) > 0 ? (
        <Img key={l.src} src={staticFile(l.src)} style={{ position: "absolute", inset: 0, width: CAPTURE.w, height: CAPTURE.h, opacity: l.opacity ?? 1 }} />
      ) : null,
    )}
    {children}
  </div>
);
