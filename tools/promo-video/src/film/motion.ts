import type React from "react";
import { Easing, interpolate } from "remotion";

export const ease = Easing.bezier(0.22, 1, 0.36, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const settle = { ...clamp, easing: ease };
/** Overshoot for small pops (cards, characters, chips). */
export const pop = { ...clamp, easing: Easing.bezier(0.34, 1.56, 0.64, 1) };

/** 0 -> 1 over `len` frames starting at `at`, with the product easing. */
export const rise = (frame: number, at: number, len = 14) => interpolate(frame, [at, at + len], [0, 1], settle);

/** 1 -> 0 over `len` frames starting at `at`. */
export const fall = (frame: number, at: number, len = 12) => interpolate(frame, [at, at + len], [1, 0], clamp);

/** In over [at, at+len], out over [out, out+outLen]; 0 outside. */
export const hold = (frame: number, at: number, out: number, len = 10, outLen = 8) =>
  Math.min(rise(frame, at, len), interpolate(frame, [out, out + outLen], [1, 0], clamp));

/** A word that lands: drops from large and blurred onto its place with a small overshoot. */
export const slam = (frame: number, at: number, len = 9): React.CSSProperties => {
  const p = interpolate(frame, [at, at + len], [0, 1], clamp);
  const s = interpolate(frame, [at, at + len * 0.7, at + len, at + len + 5], [1.5, 0.96, 1.02, 1], clamp);
  return { opacity: Math.min(1, p * 2.2), scale: s, filter: p < 1 ? `blur(${(1 - p) * 10}px)` : undefined };
};
