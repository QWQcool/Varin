import React from "react";
import { Easing } from "remotion";

/**
 * The product's own Workbench switch (packages/ui/src/components/ui/workbench-lattice.ts):
 * 44 px CSS cells grow out of the switcher in order of distance, the Profile commits underneath,
 * and a second wave takes them away. 230 ms spread, 150 ms cover, 170 ms reveal, cells at 1.03 when closed.
 * Drawn in capture pixels (DPR 2), so a cell is 88 px.
 */
const CELL = 88;
const COLS = Math.ceil(2220 / CELL);
const ROWS = Math.ceil(1410 / CELL);
const FPS = 30;
const SPREAD = (230 / 1000) * FPS;
const COVER = (150 / 1000) * FPS;
const REVEAL = (170 / 1000) * FPS;
const grow = Easing.bezier(0.22, 1, 0.36, 1);

type Props = {
  readonly frame: number;
  /** Cover wave starts here; reveal wave starts at `revealAt`. */
  readonly coverAt: number;
  readonly revealAt: number;
  readonly origin: { x: number; y: number };
  readonly fill?: string;
};

export const Lattice: React.FC<Props> = ({ frame, coverAt, revealAt, origin, fill = "#eeeeee" }) => {
  if (frame < coverAt || frame > revealAt + SPREAD + REVEAL + 1) return null;
  let far = 0;
  for (const [cx, cy] of [
    [0, 0],
    [COLS * CELL, 0],
    [0, ROWS * CELL],
    [COLS * CELL, ROWS * CELL],
  ]) {
    far = Math.max(far, Math.hypot(cx - origin.x, cy - origin.y));
  }
  const rects: React.ReactNode[] = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cx = c * CELL + CELL / 2;
      const cy = r * CELL + CELL / 2;
      const reach = Math.hypot(cx - origin.x, cy - origin.y) / far;
      const inP = Math.min(1, Math.max(0, (frame - coverAt - reach * SPREAD) / COVER));
      const outP = Math.min(1, Math.max(0, (frame - revealAt - reach * SPREAD) / REVEAL));
      const s = 1.03 * grow(inP) * (1 - grow(outP));
      if (s <= 0.001) continue;
      const size = CELL * s;
      rects.push(<rect key={r * COLS + c} x={cx - size / 2} y={cy - size / 2} width={size} height={size} rx={6 * s} fill={fill} />);
    }
  }
  return (
    <svg width={2220} height={1410} style={{ position: "absolute", inset: 0 }}>
      {rects}
    </svg>
  );
};
