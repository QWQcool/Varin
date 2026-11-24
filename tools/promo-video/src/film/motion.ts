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
