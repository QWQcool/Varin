import React from "react";
import { interpolate } from "remotion";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

type Props = {
  readonly x: number;
  readonly y: number;
  readonly frame: number;
  /** Frames on which the button goes down. */
  readonly clicks: readonly number[];
  readonly opacity?: number;
  /** "pointer" for desktop, "touch" for a fingertip on the phone. */
  readonly kind?: "pointer" | "touch";
};

/**
 * The hand that causes every reaction: a desktop arrow or a fingertip, with a press and a ripple on each click.
 * Drawn in screen space so it keeps its size while the camera zooms.
 */
export const Cursor: React.FC<Props> = ({ x, y, frame, clicks, opacity = 1, kind = "pointer" }) => {
  let press = 0;
  let ripple = -1;
  for (const c of clicks) {
    press = Math.max(press, interpolate(frame, [c - 3, c, c + 5], [0, 1, 0], clamp));
    if (frame >= c && frame < c + 16) ripple = (frame - c) / 16;
  }
  return (
    <>
      {ripple >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 2,
            height: 2,
            borderRadius: 999,
            translate: "-50% -50%",
            boxShadow: `0 0 0 ${10 + 46 * ripple}px rgba(75,111,172,${0.32 * (1 - ripple)})`,
          }}
        />
      ) : null}
      {kind === "pointer" ? (
        <svg
          width={34}
          height={44}
          viewBox="0 0 17 22"
          style={{
            position: "absolute",
            left: x - 2,
            top: y - 1,
            opacity,
            scale: 1 - 0.14 * press,
            transformOrigin: "2px 1px",
            filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.28))",
          }}
        >
          <path d="M1 1 L1 17.5 L5.2 13.6 L8.1 20.2 L11 19 L8.2 12.6 L14 12.6 Z" fill="#ffffff" stroke="#1d2224" strokeWidth={1.3} strokeLinejoin="round" />
        </svg>
      ) : (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 54,
            height: 54,
            borderRadius: 27,
            translate: "-50% -50%",
            background: `rgba(32,39,42,${0.16 + 0.14 * press})`,
            border: "3px solid rgba(255,255,255,0.85)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.18)",
            scale: 1 - 0.22 * press,
            opacity,
          }}
        />
      )}
    </>
  );
};
