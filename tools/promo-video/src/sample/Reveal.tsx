import React from "react";
import { AbsoluteFill, Easing, Interactive, interpolate, interpolateColors, useCurrentFrame } from "remotion";
import { font } from "../theme";
import { T } from "./timeline";

const ease = Easing.bezier(0.22, 1, 0.36, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
/** Accelerates into contact so the halves hit at full speed on the impact frame. */
const slam = Easing.bezier(0.45, 0, 0.9, 0.45);

const LEAD = "M-35 -19 L-11 -43 L44 -43 L57 -30 L2 -30 L-21 -7 L-21 26 L-35 12 Z";
const TRAIL = "M35 19 L11 43 L-44 43 L-57 30 L-2 30 L21 7 L21 -26 L35 -12 Z";

/**
 * Lockup geometry from .github/readme/assets/wordmark.svg: mark at (380,120) scale 1.28,
 * text baseline at (495,154), Inter 600 102px, letter-spacing -4. Content box centre (518,120).
 * Scaled by K and centred on (960, LOCK_Y).
 */
const K = 1.34;
const LOCK_Y = 430;
const LOCK = {
  markX: 960 + (380 - 518) * K,
  markY: LOCK_Y,
  markSize: 128 * 1.28 * K,
  textX: 960 + (495 - 518) * K,
  baseline: LOCK_Y + (154 - 120) * K,
  fontSize: 102 * K,
  letterSpacing: -4 * K,
};

/**
 * Starts at `T.bracketFly`. The two halves of the Varin mark close in from opposite corners,
 * land on the impact, and the paper world opens from the point of contact.
 */
export const Reveal: React.FC = () => {
  const g = useCurrentFrame();
  const hit = T.impact - T.bracketFly;
  const word = T.wordmark - T.bracketFly;
  const tag = T.tagline - T.bracketFly;
  const sub = T.subline - T.bracketFly;

  const recoil = interpolate(g, [hit, hit + 2, hit + 10], [1, 1.08, 1], clamp);
  const flight = interpolate(g, [0, hit], [2.6, 1], { ...clamp, easing: slam });
  const settle = { ...clamp, easing: ease };
  const cx = interpolate(g, [hit + 18, hit + 32], [960, LOCK.markX], settle);
  const cy = interpolate(g, [hit + 18, hit + 32], [540, LOCK.markY], settle);
  const size = interpolate(g, [hit + 18, hit + 32], [260, LOCK.markSize], settle);

  return (
    <AbsoluteFill style={{ fontFamily: font.sans }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 1300px 900px at 960px 470px, #f6f6f1 0%, #efefe8 60%, #e6e6de 100%)",
          clipPath: `circle(${interpolate(g, [hit, hit + 16], [0, 1250], settle)}px at 960px 540px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: "#ffffff",
          opacity: interpolate(g, [hit, hit + 1, hit + 6], [0, 0.28, 0], clamp),
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox="-64 -64 128 128"
        style={{
          position: "absolute",
          left: cx - size / 2,
          top: cy - size / 2,
          overflow: "visible",
          translate: `${interpolate(g, [0, hit], [-820, 0], { ...clamp, easing: slam })}px ${interpolate(g, [0, hit], [-520, 0], { ...clamp, easing: slam })}px`,
          rotate: `${interpolate(g, [0, hit], [-10, 0], { ...clamp, easing: slam })}deg`,
          scale: flight * recoil,
        }}
      >
        <path d={LEAD} fill={interpolateColors(g, [hit, hit + 3], ["#eeeee8", "#20272a"])} />
      </svg>
      <svg
        width={size}
        height={size}
        viewBox="-64 -64 128 128"
        style={{
          position: "absolute",
          left: cx - size / 2,
          top: cy - size / 2,
          overflow: "visible",
          translate: `${interpolate(g, [0, hit], [820, 0], { ...clamp, easing: slam })}px ${interpolate(g, [0, hit], [520, 0], { ...clamp, easing: slam })}px`,
          rotate: `${interpolate(g, [0, hit], [-10, 0], { ...clamp, easing: slam })}deg`,
          scale: flight * recoil,
        }}
      >
        <path d={TRAIL} fill={interpolateColors(g, [hit, hit + 3], ["#8e9694", "#77837f"])} />
      </svg>

      <svg
        width={1920}
        height={1080}
        style={{
          position: "absolute",
          inset: 0,
          clipPath: `inset(0 ${interpolate(g, [word, word + 14], [100 - (LOCK.textX / 1920) * 100, 0], settle)}% 0 0)`,
          translate: `${interpolate(g, [word, word + 16], [28, 0], settle)}px 0px`,
        }}
      >
        <text
          x={LOCK.textX}
          y={LOCK.baseline}
          fill="#20272a"
          fontFamily="Inter"
          fontSize={LOCK.fontSize}
          fontWeight={600}
          letterSpacing={LOCK.letterSpacing}
        >
          Varin
        </text>
      </svg>

      <Interactive.Div
        name="Promise"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 582,
          textAlign: "center",
          fontSize: 92,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#20272a",
          opacity: interpolate(g, [tag, tag + 10], [0, 1], clamp),
          translate: `0px ${interpolate(g, [tag, tag + 14], [26, 0], settle)}px`,
        }}
      >
        通用 <span style={{ color: "#4b6fac" }}>Super Agent</span>
      </Interactive.Div>

      <Interactive.Div
        name="Promise detail"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 736,
          textAlign: "center",
          fontSize: 40,
          fontWeight: 450,
          letterSpacing: 1,
          color: "#686868",
          opacity: interpolate(g, [sub, sub + 10], [0, 1], clamp),
          translate: `0px ${interpolate(g, [sub, sub + 14], [18, 0], settle)}px`,
        }}
      >
        一个对话，调度模型、Agent 和你连上的每台设备。
      </Interactive.Div>
    </AbsoluteFill>
  );
};
