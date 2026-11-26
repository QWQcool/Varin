import type React from "react";
import { Easing } from "remotion";

export type Ease = (t: number) => number;

/** Camera curves: a follow (S-curve), a whip (slow-fast-landing) and a snap (fast out, long settle). */
export const camEase = {
  follow: Easing.bezier(0.45, 0, 0.25, 1),
  whip: Easing.bezier(0.7, 0, 0.12, 1),
  snap: Easing.bezier(0.16, 1, 0.3, 1),
} as const;

/** World point at the centre of the frame and zoom. */
export type Cam = { readonly x: number; readonly y: number; readonly z: number };
/** [frame, x, y, z, ease into this key]. */
export type CamKey = readonly [number, number, number, number, Ease?];

/** Keyed camera; zoom interpolates in log space so pushes feel constant-rate. */
export const camAt = (f: number, keys: readonly CamKey[]): Cam => {
  if (f <= keys[0][0]) return { x: keys[0][1], y: keys[0][2], z: keys[0][3] };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f < b[0]) {
      const e = (b[4] ?? camEase.follow)((f - a[0]) / (b[0] - a[0]));
      return {
        x: a[1] + (b[1] - a[1]) * e,
        y: a[2] + (b[2] - a[2]) * e,
        z: Math.exp(Math.log(a[3]) + (Math.log(b[3]) - Math.log(a[3])) * e),
      };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l[1], y: l[2], z: l[3] };
};

export const camStyle = (c: Cam): React.CSSProperties => ({
  position: "absolute",
  left: 0,
  top: 0,
  width: 1920,
  height: 1080,
  transformOrigin: "0 0",
  transform: `translate(${960 - c.x * c.z}px, ${540 - c.y * c.z}px) scale(${c.z})`,
});

export const toScreen = (c: Cam, p: { x: number; y: number }) => ({ x: 960 + (p.x - c.x) * c.z, y: 540 + (p.y - c.y) * c.z });

/** A screenshot placed in the world: `k` maps capture pixels (2220-wide, DPR 2) to world units. */
export type Placement = { readonly x: number; readonly y: number; readonly k: number };
export const inWorld = (p: Placement, px: number, py: number) => ({ x: p.x + px * p.k, y: p.y + py * p.k });

/** Keyed 2D path (cursor, finger) with an S-curve between keys. */
export type PathKey = readonly [number, number, number];
export const pathAt = (f: number, keys: readonly PathKey[]) => {
  if (f <= keys[0][0]) return { x: keys[0][1], y: keys[0][2] };
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (f < b[0]) {
      const e = camEase.follow((f - a[0]) / (b[0] - a[0]));
      return { x: a[1] + (b[1] - a[1]) * e, y: a[2] + (b[2] - a[2]) * e };
    }
  }
  const l = keys[keys.length - 1];
  return { x: l[1], y: l[2] };
};
