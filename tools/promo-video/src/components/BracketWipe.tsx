import React from "react";
import { color } from "../theme";

const LEAD = "M-35 -19 L-11 -43 L44 -43 L57 -30 L2 -30 L-21 -7 L-21 26 L-35 12 Z";
const TRAIL = "M35 19 L11 43 L-44 43 L-57 30 L-2 30 L21 7 L21 -26 L35 -12 Z";

type Props = {
  /** 0 = closed over the centre, 1 = fully parted off-screen. */
  readonly open: number;
  readonly fill?: string;
};

/**
 * Chapter wipe: the two halves of the Varin mark, scaled up to cover the frame,
 * slide apart along their diagonal to reveal the next chapter.
 */
export const BracketWipe: React.FC<Props> = ({ open, fill = color.ink }) => {
  if (open >= 1) return null;
  const size = 2600;
  const dx = 1500 * open;
  const dy = 900 * open;
  return (
    <svg width={1920} height={1080} style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
      <g transform={`translate(${960 - dx} ${540 - dy}) scale(${size / 128})`}>
        <path d={LEAD} fill={fill} />
      </g>
      <g transform={`translate(${960 + dx} ${540 + dy}) scale(${size / 128})`}>
        <path d={TRAIL} fill={fill} />
      </g>
    </svg>
  );
};
